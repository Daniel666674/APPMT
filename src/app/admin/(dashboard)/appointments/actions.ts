"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessSession } from "@/lib/auth";
import { formatBusinessDate, formatBusinessTime } from "@/lib/availability";
import { prisma } from "@/lib/db";
import { sendBookingCancelledEmail, sendBookingConfirmationEmail } from "@/lib/email";
import { adminCreateBookingSchema } from "@/lib/validations";

export async function createAppointment(input: unknown) {
  const { business, businessId } = await requireBusinessSession();
  const parsed = adminCreateBookingSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const data = parsed.data;

  // Both lookups are scoped to this business, so ids from another tenant
  // simply don't resolve.
  const [service, staff] = await Promise.all([
    prisma.service.findFirst({ where: { id: data.serviceId, businessId } }),
    prisma.staff.findFirst({ where: { id: data.staffId, businessId } }),
  ]);
  if (!service) throw new Error("Servicio no encontrado");
  if (!staff) throw new Error("Persona no encontrada");

  const eligible = await prisma.serviceStaff.findUnique({
    where: { serviceId_staffId: { serviceId: service.id, staffId: staff.id } },
  });
  if (!eligible) throw new Error("Esta persona no realiza este servicio");

  const startsAt = new Date(data.startsAt);
  const endsAt = new Date(startsAt.getTime() + service.durationMinutes * 60_000);

  const overlap = await prisma.booking.findFirst({
    where: {
      staffId: data.staffId,
      status: { in: ["PENDING", "CONFIRMED"] },
      startsAt: { lt: endsAt },
      endsAt: { gt: startsAt },
    },
  });
  if (overlap) throw new Error("Esta persona ya tiene una cita a esa hora.");

  const customer = await prisma.customer.upsert({
    where: { businessId_email: { businessId, email: data.customerEmail } },
    update: { name: data.customerName, phone: data.customerPhone || undefined },
    create: {
      businessId,
      name: data.customerName,
      email: data.customerEmail,
      phone: data.customerPhone || undefined,
    },
  });

  let booking;
  try {
    booking = await prisma.booking.create({
      data: {
        businessId,
        serviceId: service.id,
        staffId: staff.id,
        customerId: customer.id,
        startsAt,
        endsAt,
        notes: data.notes || undefined,
        status: data.status ?? "CONFIRMED",
      },
    });
  } catch {
    throw new Error("Ese horario acaba de ocuparse. Escoge otro.");
  }

  if (booking.status === "CONFIRMED") {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";
    await sendBookingConfirmationEmail({
      businessName: business.name,
      logoUrl: business.logoUrl,
      primaryColor: business.primaryColor,
      customerName: customer.name,
      customerEmail: customer.email,
      serviceName: service.name,
      staffName: staff.name,
      dateLabel: formatBusinessDate(startsAt, business.timezone),
      timeLabel: formatBusinessTime(startsAt, business.timezone),
      start: startsAt,
      end: endsAt,
      manageUrl: `${appUrl}/manage/${booking.manageToken}`,
      location: business.address ?? undefined,
    }).catch((err) => console.error("[email] admin booking confirmation failed:", err));
  }

  revalidatePath("/admin/appointments");
  revalidatePath("/admin");
}

export async function updateAppointmentStatus(id: string, status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED" | "NO_SHOW") {
  const { business, businessId } = await requireBusinessSession();

  // Scoped: a booking id from another business must not resolve.
  const booking = await prisma.booking.findFirst({
    where: { id, businessId },
    include: { service: true, staff: true, customer: true },
  });
  if (!booking) throw new Error("Cita no encontrada");

  const updated = await prisma.booking.update({
    where: { id },
    data: {
      status,
      cancelledAt: status === "CANCELLED" ? new Date() : null,
    },
  });

  if (status === "CANCELLED" && booking.status !== "CANCELLED") {
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
      bookAgainUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/${business.slug}/book/${booking.serviceId}`,
    }).catch((err) => console.error("[email] admin cancellation failed:", err));
  }

  revalidatePath("/admin/appointments");
  revalidatePath("/admin");
  return updated.status;
}
