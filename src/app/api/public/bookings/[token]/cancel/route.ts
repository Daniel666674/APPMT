import { subHours } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { formatBusinessDate, formatBusinessTime } from "@/lib/availability";
import { prisma } from "@/lib/db";
import { sendBookingCancelledEmail } from "@/lib/email";
import { cancelBookingSchema } from "@/lib/validations";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = cancelBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { service: true, customer: true, staff: true, business: true },
  });
  if (!booking) return NextResponse.json({ error: "No encontramos la cita" }, { status: 404 });
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "Esta cita ya está cancelada." }, { status: 400 });
  }

  const business = booking.business;
  const now = new Date();

  if (booking.startsAt < now) {
    return NextResponse.json({ error: "La fecha de esta cita ya pasó." }, { status: 400 });
  }

  const cutoff = subHours(booking.startsAt, business.cancellationWindowHours);
  if (now > cutoff) {
    const contact = business.contactPhone || business.contactEmail || "el negocio directamente";
    return NextResponse.json(
      {
        error: `Esta cita está dentro de la ventana de cancelación de ${business.cancellationWindowHours} horas. Comunícate con ${contact} para cancelarla.`,
      },
      { status: 400 }
    );
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", cancelledAt: now, cancelReason: parsed.data.reason || undefined },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  await sendBookingCancelledEmail({
    businessName: business.name,
    logoUrl: business.logoUrl,
    primaryColor: business.primaryColor,
    customerName: booking.customer.name,
    customerEmail: booking.customer.email,
    serviceName: booking.service.name,
    staffName: booking.staff.name,
    dateLabel: formatBusinessDate(booking.startsAt, business.timezone),
    timeLabel: formatBusinessTime(booking.startsAt, business.timezone),
    bookAgainUrl: `${appUrl}/${business.slug}/book/${booking.serviceId}`,
  }).catch((err) => console.error("[email] cancellation failed:", err));

  return NextResponse.json({ status: updated.status });
}
