"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serviceSchema } from "@/lib/validations";

export async function createService(input: unknown) {
  const { business, businessId } = await requireBusinessSession();
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const { staffIds, ...data } = parsed.data;
  const count = await prisma.service.count({ where: { businessId } });
  const ownStaffIds = await ownedStaffIds(businessId, staffIds);

  await prisma.service.create({
    data: {
      businessId,
      ...data,
      description: data.description || null,
      price: data.price ?? null,
      sortOrder: count,
      staff: ownStaffIds.length ? { create: ownStaffIds.map((staffId) => ({ staffId })) } : undefined,
    },
  });

  revalidatePath("/admin/services");
  revalidatePath(`/${business.slug}`, "layout");
}

export async function updateService(id: string, input: unknown) {
  const { business, businessId } = await requireBusinessSession();
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const { staffIds, ...data } = parsed.data;
  await assertOwnService(businessId, id);
  const ownStaffIds = await ownedStaffIds(businessId, staffIds);

  await prisma.$transaction([
    prisma.service.update({
      where: { id },
      data: { ...data, description: data.description || null, price: data.price ?? null },
    }),
    prisma.serviceStaff.deleteMany({ where: { serviceId: id } }),
    ...(ownStaffIds.length
      ? [prisma.serviceStaff.createMany({ data: ownStaffIds.map((staffId) => ({ serviceId: id, staffId })) })]
      : []),
  ]);

  revalidatePath("/admin/services");
  revalidatePath(`/${business.slug}`, "layout");
}

export async function deleteService(id: string) {
  const { business, businessId } = await requireBusinessSession();
  await assertOwnService(businessId, id);
  const upcoming = await prisma.booking.count({
    where: { serviceId: id, startsAt: { gte: new Date() }, status: { in: ["CONFIRMED", "PENDING"] } },
  });
  if (upcoming > 0) {
    throw new Error("Este servicio tiene citas próximas. Desactívalo en lugar de eliminarlo.");
  }
  await prisma.service.delete({ where: { id } });
  revalidatePath("/admin/services");
  revalidatePath(`/${business.slug}`, "layout");
}

export async function toggleServiceActive(id: string, active: boolean) {
  const { business, businessId } = await requireBusinessSession();
  await assertOwnService(businessId, id);
  await prisma.service.update({ where: { id }, data: { active } });
  revalidatePath("/admin/services");
  revalidatePath(`/${business.slug}`, "layout");
}

/**
 * Refuses to touch a service that belongs to another business. Ids arrive
 * from the browser, so every mutation confirms ownership before writing.
 */
async function assertOwnService(businessId: string, serviceId: string) {
  const owned = await prisma.service.findFirst({ where: { id: serviceId, businessId }, select: { id: true } });
  if (!owned) throw new Error("Servicio no encontrado");
}

/** Keeps only the staff ids that belong to this business. */
async function ownedStaffIds(businessId: string, staffIds: string[] | undefined) {
  if (!staffIds?.length) return [];
  const rows = await prisma.staff.findMany({
    where: { id: { in: staffIds }, businessId },
    select: { id: true },
  });
  return rows.map((r) => r.id);
}
