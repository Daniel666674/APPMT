import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots, formatBusinessDate, formatBusinessTime } from "@/lib/availability";
import { getBusinessBySlug } from "@/lib/business";
import { prisma } from "@/lib/db";
import { sendBookingConfirmationEmail, sendNewBookingNoticeEmail } from "@/lib/email";
import { clientIpFrom, rateLimit } from "@/lib/rate-limit";
import { createBookingSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  const ip = clientIpFrom(request.headers);
  const limited = rateLimit(`create-booking:${ip}`, 8, 5 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Demasiadas solicitudes. Intenta de nuevo en unos minutos." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = createBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Solicitud inválida" }, { status: 400 });
  }
  const input = parsed.data;

  const business = await getBusinessBySlug(input.slug);
  if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

  // Both the service and the staff member are looked up scoped to this
  // business, so ids belonging to another tenant simply don't resolve.
  const service = await prisma.service.findFirst({
    where: { id: input.serviceId, businessId: business.id, active: true },
  });
  if (!service) {
    return NextResponse.json({ error: "Este servicio ya no está disponible." }, { status: 404 });
  }

  const staff = await prisma.staff.findFirst({
    where: { id: input.staffId, businessId: business.id, active: true },
  });
  if (!staff) {
    return NextResponse.json({ error: "Esta persona no está disponible." }, { status: 400 });
  }

  const eligible = await prisma.serviceStaff.findUnique({
    where: { serviceId_staffId: { serviceId: service.id, staffId: staff.id } },
  });
  if (!eligible) {
    return NextResponse.json({ error: "Esta persona no realiza este servicio." }, { status: 400 });
  }

  const requestedStart = new Date(input.startsAt);
  const localDate = formatInBusinessTz(requestedStart, business.timezone);

  // Re-derive the real availability server-side rather than trusting the
  // client-supplied time — this single check enforces business hours,
  // time off, minimum notice, max advance window, and no double-booking.
  const slots = await getAvailableSlots({
    business,
    staffId: staff.id,
    serviceDurationMinutes: service.durationMinutes,
    date: localDate,
  });
  const match = slots.find((s) => s.start === requestedStart.toISOString());
  if (!match) {
    return NextResponse.json({ error: "Ese horario ya no está disponible. Elige otro." }, { status: 409 });
  }

  const customer = await prisma.customer.upsert({
    where: { businessId_email: { businessId: business.id, email: input.customerEmail } },
    update: { name: input.customerName, phone: input.customerPhone || undefined },
    create: {
      businessId: business.id,
      name: input.customerName,
      email: input.customerEmail,
      phone: input.customerPhone || undefined,
    },
  });

  let booking;
  try {
    booking = await prisma.booking.create({
      data: {
        businessId: business.id,
        serviceId: service.id,
        staffId: staff.id,
        customerId: customer.id,
        startsAt: new Date(match.start),
        endsAt: new Date(match.end),
        customerNotes: input.customerNotes || undefined,
        status: "CONFIRMED",
      },
    });
  } catch (err) {
    // Backstop against the rare race the pre-check above can't fully close:
    // the database-level exclusion constraint (see prisma/migrations) is
    // the real guarantee against double-booking.
    console.error("[bookings] insert failed, likely a slot race:", err);
    return NextResponse.json({ error: "Alguien acaba de reservar ese horario. Elige otro." }, { status: 409 });
  }

  const dateLabel = formatBusinessDate(booking.startsAt, business.timezone);
  const timeLabel = formatBusinessTime(booking.startsAt, business.timezone);
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  const manageUrl = `${appUrl}/manage/${booking.manageToken}`;

  const emailCtx = {
    businessName: business.name,
    logoUrl: business.logoUrl,
    primaryColor: business.primaryColor,
    customerName: customer.name,
    customerEmail: customer.email,
    serviceName: service.name,
    staffName: staff.name,
    dateLabel,
    timeLabel,
    start: booking.startsAt,
    end: booking.endsAt,
    manageUrl,
    location: business.address ?? undefined,
  };

  await sendBookingConfirmationEmail(emailCtx).catch((err) => console.error("[email] confirmation failed:", err));

  if (business.contactEmail) {
    await sendNewBookingNoticeEmail({
      ...emailCtx,
      ownerEmail: business.contactEmail,
      customerPhone: customer.phone,
      adminUrl: `${appUrl}/admin/appointments`,
    }).catch((err) => console.error("[email] owner notice failed:", err));
  }

  return NextResponse.json({ id: booking.id, manageToken: booking.manageToken }, { status: 201 });
}

function formatInBusinessTz(date: Date, timeZone: string) {
  // en-CA formats as YYYY-MM-DD, which is what the availability engine wants.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}
