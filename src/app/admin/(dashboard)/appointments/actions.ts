"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { formatBusinessDate, formatBusinessTime, staffCanPerformService } from "@/lib/availability";
import { getBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { sendBookingCancelledEmail, sendBookingConfirmationEmail } from "@/lib/email";
import { adminCreateBookingSchema } from "@/lib/validations";

export async function createAppointment(input: unknown) {
  await requireSession();
  const parsed = adminCreateBookingSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const data = parsed.data;

  const [service, staff, eligible] = await Promise.all([
    prisma.service.findUnique({ where: { id: data.serviceId } }),
    prisma.staff.findUnique({ where: { id: data.staffId } }),
    staffCanPerformService(data.staffId, data.serviceId),
  ]);
  if (!service) throw new Error("Servicio no encontrado");
  if (!staff) throw new Error("Persona no encontrada");
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
    where: { email: data.customerEmail },
    update: { name: data.customerName, phone: data.customerPhone || undefined },
    create: { name: data.customerName, email: data.customerEmail, phone: data.customerPhone || undefined },
  });

  let booking;
  try {
    booking = await prisma.booking.create({
      data: {
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
    throw new Error("Ese horario acaba de ocuparse. Elige otro.");
  }

  if (booking.status === "CONFIRMED") {
    const business = await getBusiness();
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
  await requireSession();

  const booking = await prisma.booking.findUnique({
    where: { id },
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
    const business = await getBusiness();
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
      bookAgainUrl: `${process.env.NEXT_PUBLIC_APP_URL ?? ""}/book/${booking.serviceId}`,
    }).catch((err) => console.error("[email] admin cancellation failed:", err));
  }

  revalidatePath("/admin/appointments");
  revalidatePath("/admin");
  return updated.status;
}
