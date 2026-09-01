"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { staffSchema, weeklyAvailabilitySchema, timeOffSchema } from "@/lib/validations";

export async function createStaff(input: unknown) {
  const { business, businessId } = await requireBusinessSession();
  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const { serviceIds, ...data } = parsed.data;
  const count = await prisma.staff.count({ where: { businessId } });
  const ownServiceIds = await ownedServiceIds(businessId, serviceIds);

  await prisma.staff.create({
    data: {
      businessId,
      ...data,
      email: data.email || null,
      phone: data.phone || null,
      bio: data.bio || null,
      sortOrder: count,
      services: ownServiceIds.length ? { create: ownServiceIds.map((serviceId) => ({ serviceId })) } : undefined,
    },
  });

  revalidatePath("/admin/staff");
  revalidatePath(`/${business.slug}`, "layout");
}

export async function updateStaff(id: string, input: unknown) {
  const { business, businessId } = await requireBusinessSession();
  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const { serviceIds, ...data } = parsed.data;
  await assertOwnStaff(businessId, id);
  const ownServiceIds = await ownedServiceIds(businessId, serviceIds);

  await prisma.$transaction([
    prisma.staff.update({
      where: { id },
      data: { ...data, email: data.email || null, phone: data.phone || null, bio: data.bio || null },
    }),
    prisma.serviceStaff.deleteMany({ where: { staffId: id } }),
    ...(ownServiceIds.length
      ? [prisma.serviceStaff.createMany({ data: ownServiceIds.map((serviceId) => ({ serviceId, staffId: id })) })]
      : []),
  ]);

  revalidatePath("/admin/staff");
  revalidatePath(`/${business.slug}`, "layout");
}

export async function deleteStaff(id: string) {
  const { business, businessId } = await requireBusinessSession();
  await assertOwnStaff(businessId, id);
  const upcoming = await prisma.booking.count({
    where: { staffId: id, startsAt: { gte: new Date() }, status: { in: ["CONFIRMED", "PENDING"] } },
  });
  if (upcoming > 0) {
    throw new Error("Esta persona tiene citas próximas. Desactívala en lugar de eliminarla.");
  }
  await prisma.staff.delete({ where: { id } });
  revalidatePath("/admin/staff");
  revalidatePath(`/${business.slug}`, "layout");
}

export async function toggleStaffActive(id: string, active: boolean) {
  const { business, businessId } = await requireBusinessSession();
  await assertOwnStaff(businessId, id);
  await prisma.staff.update({ where: { id }, data: { active } });
  revalidatePath("/admin/staff");
  revalidatePath(`/${business.slug}`, "layout");
}

export async function saveWeeklyAvailability(staffId: string, input: unknown) {
  const { businessId } = await requireBusinessSession();
  await assertOwnStaff(businessId, staffId);
  const parsed = weeklyAvailabilitySchema.safeParse(input);
  if (!parsed.success) throw new Error("Horario inválido");

  for (const block of parsed.data.blocks) {
    if (block.endMinute <= block.startMinute) {
      throw new Error("La hora de fin debe ser posterior a la de inicio");
    }
  }

  await prisma.$transaction([
    prisma.availability.deleteMany({ where: { staffId } }),
    ...(parsed.data.blocks.length
      ? [prisma.availability.createMany({ data: parsed.data.blocks.map((b) => ({ ...b, staffId })) })]
      : []),
  ]);

  revalidatePath(`/admin/staff/${staffId}/availability`);
}

export async function createTimeOff(input: unknown) {
  const { businessId } = await requireBusinessSession();
  const parsed = timeOffSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  if (parsed.data.staffId) await assertOwnStaff(businessId, parsed.data.staffId);

  await prisma.timeOff.create({
    data: {
      businessId,
      staffId: parsed.data.staffId,
      date: new Date(`${parsed.data.date}T00:00:00Z`),
      allDay: parsed.data.allDay,
      startMinute: parsed.data.allDay ? null : parsed.data.startMinute,
      endMinute: parsed.data.allDay ? null : parsed.data.endMinute,
      reason: parsed.data.reason || null,
    },
  });

  revalidatePath("/admin", "layout");
}

export async function deleteTimeOff(id: string) {
  const { businessId } = await requireBusinessSession();
  const owned = await prisma.timeOff.findFirst({ where: { id, businessId }, select: { id: true } });
  if (!owned) throw new Error("No encontramos esa ausencia");
  await prisma.timeOff.delete({ where: { id } });
  revalidatePath("/admin", "layout");
}

/**
 * Refuses to touch a staff member belonging to another business. Ids arrive
 * from the browser, so every mutation confirms ownership before writing.
 */
async function assertOwnStaff(businessId: string, staffId: string) {
  const owned = await prisma.staff.findFirst({ where: { id: staffId, businessId }, select: { id: true } });
  if (!owned) throw new Error("Persona no encontrada");
}

/** Keeps only the service ids that belong to this business. */
async function ownedServiceIds(businessId: string, serviceIds: string[] | undefined) {
  if (!serviceIds?.length) return [];
  const rows = await prisma.service.findMany({
    where: { id: { in: serviceIds }, businessId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}
