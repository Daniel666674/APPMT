"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createSessionCookie, requirePlatformAdmin, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { INDUSTRIES } from "@/lib/industries";
import { ProvisionError, provisionBusiness } from "@/lib/provision";

/**
 * Fills the demo library in one click: one agenda per sector that doesn't
 * already have one.
 *
 * Building your own demos through the five-step creator is pointless typing —
 * the preset already knows the name, the colors, the services, the prices,
 * the team and the hours. The creator exists for a client's real branding;
 * this exists for stock.
 *
 * Skips sectors already present, so it can be run again after adding a new
 * preset and only fills the gap.
 */
export async function createMissingDemos() {
  await requirePlatformAdmin();

  const existing = await prisma.business.findMany({ select: { name: true } });
  const taken = new Set(existing.map((b) => b.name.trim().toLowerCase()));

  const created: string[] = [];
  for (const industry of INDUSTRIES) {
    if (taken.has(industry.defaultBusinessName.trim().toLowerCase())) continue;
    try {
      const result = await provisionBusiness(prisma, {
        industryKey: industry.key,
        createOwnerUser: false,
        listed: true,
      });
      created.push(result.businessName);
    } catch (err) {
      // One bad preset shouldn't abandon the rest half-built.
      if (err instanceof ProvisionError) continue;
      throw err;
    }
  }

  revalidatePath("/admin/negocios");
  revalidatePath("/");
  return { created: created.length, names: created };
}

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
