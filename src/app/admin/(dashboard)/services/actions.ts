"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { serviceSchema } from "@/lib/validations";

export async function createService(input: unknown) {
  await requireSession();
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");

  const { staffIds, ...data } = parsed.data;
  const count = await prisma.service.count();

  await prisma.service.create({
    data: {
      ...data,
      description: data.description || null,
      price: data.price ?? null,
      sortOrder: count,
      staff: staffIds?.length ? { create: staffIds.map((staffId) => ({ staffId })) } : undefined,
    },
  });

  revalidatePath("/admin/services");
  revalidatePath("/");
}

export async function updateService(id: string, input: unknown) {
  await requireSession();
  const parsed = serviceSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");

  const { staffIds, ...data } = parsed.data;

  await prisma.$transaction([
    prisma.service.update({
      where: { id },
      data: { ...data, description: data.description || null, price: data.price ?? null },
    }),
    prisma.serviceStaff.deleteMany({ where: { serviceId: id } }),
    ...(staffIds?.length
      ? [prisma.serviceStaff.createMany({ data: staffIds.map((staffId) => ({ serviceId: id, staffId })) })]
      : []),
  ]);

  revalidatePath("/admin/services");
  revalidatePath("/");
}

export async function deleteService(id: string) {
  await requireSession();
  const upcoming = await prisma.booking.count({
    where: { serviceId: id, startsAt: { gte: new Date() }, status: { in: ["CONFIRMED", "PENDING"] } },
  });
  if (upcoming > 0) {
    throw new Error("This service has upcoming appointments. Deactivate it instead of deleting.");
  }
  await prisma.service.delete({ where: { id } });
  revalidatePath("/admin/services");
  revalidatePath("/");
}

export async function toggleServiceActive(id: string, active: boolean) {
  await requireSession();
  await prisma.service.update({ where: { id }, data: { active } });
  revalidatePath("/admin/services");
  revalidatePath("/");
}
