"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { staffSchema, weeklyAvailabilitySchema, timeOffSchema } from "@/lib/validations";

export async function createStaff(input: unknown) {
  await requireSession();
  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");

  const { serviceIds, ...data } = parsed.data;
  const count = await prisma.staff.count();

  await prisma.staff.create({
    data: {
      ...data,
      email: data.email || null,
      phone: data.phone || null,
      bio: data.bio || null,
      sortOrder: count,
      services: serviceIds?.length ? { create: serviceIds.map((serviceId) => ({ serviceId })) } : undefined,
    },
  });

  revalidatePath("/admin/staff");
  revalidatePath("/");
}

export async function updateStaff(id: string, input: unknown) {
  await requireSession();
  const parsed = staffSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");

  const { serviceIds, ...data } = parsed.data;

  await prisma.$transaction([
    prisma.staff.update({
      where: { id },
      data: { ...data, email: data.email || null, phone: data.phone || null, bio: data.bio || null },
    }),
    prisma.serviceStaff.deleteMany({ where: { staffId: id } }),
    ...(serviceIds?.length
      ? [prisma.serviceStaff.createMany({ data: serviceIds.map((serviceId) => ({ serviceId, staffId: id })) })]
      : []),
  ]);

  revalidatePath("/admin/staff");
  revalidatePath("/");
}

export async function deleteStaff(id: string) {
  await requireSession();
  const upcoming = await prisma.booking.count({
    where: { staffId: id, startsAt: { gte: new Date() }, status: { in: ["CONFIRMED", "PENDING"] } },
  });
  if (upcoming > 0) {
    throw new Error("This staff member has upcoming appointments. Deactivate instead of deleting.");
  }
  await prisma.staff.delete({ where: { id } });
  revalidatePath("/admin/staff");
  revalidatePath("/");
}

export async function toggleStaffActive(id: string, active: boolean) {
  await requireSession();
  await prisma.staff.update({ where: { id }, data: { active } });
  revalidatePath("/admin/staff");
  revalidatePath("/");
}

export async function saveWeeklyAvailability(staffId: string, input: unknown) {
  await requireSession();
  const parsed = weeklyAvailabilitySchema.safeParse(input);
  if (!parsed.success) throw new Error("Invalid schedule");

  for (const block of parsed.data.blocks) {
    if (block.endMinute <= block.startMinute) {
      throw new Error("End time must be after start time");
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
  await requireSession();
  const parsed = timeOffSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");

  await prisma.timeOff.create({
    data: {
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
  await requireSession();
  await prisma.timeOff.delete({ where: { id } });
  revalidatePath("/admin", "layout");
}
