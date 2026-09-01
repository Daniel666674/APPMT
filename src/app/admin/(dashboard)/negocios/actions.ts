"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSessionCookie, requirePlatformAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";

/**
 * Points the current session at another business. This is the one place a
 * session's businessId changes, and it is gated on platform access being
 * re-read from the database — never on the cookie's own claim.
 */
export async function switchBusiness(businessId: string) {
  const session = await requirePlatformAdmin();

  const target = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, slug: true },
  });
  if (!target) throw new Error("No encontramos esa agenda");

  await createSessionCookie({ ...session, businessId: target.id, isPlatformAdmin: true });
  revalidatePath("/admin", "layout");
  redirect("/admin");
}

/**
 * Deletes an agenda and everything under it. The database cascades from
 * Business, so this removes its staff, services, customers and bookings too.
 */
export async function deleteBusiness(businessId: string) {
  const session = await requirePlatformAdmin();

  const target = await prisma.business.findUnique({
    where: { id: businessId },
    select: { id: true, name: true },
  });
  if (!target) throw new Error("No encontramos esa agenda");

  const remaining = await prisma.business.count();
  if (remaining <= 1) {
    throw new Error("Es la única agenda del despliegue. Crea otra antes de eliminarla.");
  }

  // Deleting the agenda you are standing in would leave the session pointing
  // at nothing, so move to another one first.
  if (session.businessId === businessId) {
    const fallback = await prisma.business.findFirst({
      where: { id: { not: businessId } },
      orderBy: { createdAt: "asc" },
      select: { id: true },
    });
    if (fallback) {
      await createSessionCookie({ ...session, businessId: fallback.id, isPlatformAdmin: true });
    }
  }

  await prisma.business.delete({ where: { id: businessId } });
  revalidatePath("/admin/negocios");
  revalidatePath("/");
}

/** Show or hide an agenda in the public demo library at `/`. */
export async function toggleBusinessListed(businessId: string, listed: boolean) {
  await requirePlatformAdmin();
  await prisma.business.update({ where: { id: businessId }, data: { listed } });
  revalidatePath("/admin/negocios");
  revalidatePath("/");
}

/** Guards the console's own pages. */
export async function assertPlatformAdmin() {
  await requireSession();
  await requirePlatformAdmin();
}
