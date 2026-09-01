"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  clearDemoBookings,
  duplicateDemo,
  resetDemoToPreset,
  saveDemo,
  seedSampleBookings,
} from "@/lib/demo-builder";

/**
 * Every action here reaches across businesses, so every one of them starts by
 * re-checking platform access against the database. There is no cheaper
 * shortcut: the session cookie's claim is never enough.
 */
async function guard(businessId: string) {
  await requirePlatformAdmin();
  const exists = await prisma.business.findUnique({ where: { id: businessId }, select: { slug: true } });
  if (!exists) throw new Error("Esta agenda ya no existe.");
  return exists;
}

function refresh(slug: string, previousSlug?: string) {
  revalidatePath("/");
  revalidatePath("/admin/negocios");
  revalidatePath(`/admin/negocios/${slug}`);
  revalidatePath(`/${slug}`, "layout");
  if (previousSlug && previousSlug !== slug) revalidatePath(`/${previousSlug}`, "layout");
}

export async function saveDemoAction(businessId: string, input: unknown) {
  await guard(businessId);
  const { slug, previousSlug } = await saveDemo(businessId, input);
  refresh(slug, previousSlug);
  revalidatePath(`/admin/negocios/${businessId}/editar`);
  return { slug };
}

export async function duplicateDemoAction(businessId: string, newName?: string) {
  await guard(businessId);
  const copy = await duplicateDemo(businessId, newName);
  refresh(copy.slug);
  redirect(`/admin/negocios/${copy.businessId}/editar`);
}

export async function resetDemoAction(businessId: string) {
  const { slug } = await guard(businessId);
  const result = await resetDemoToPreset(businessId);
  refresh(slug);
  revalidatePath(`/admin/negocios/${businessId}/editar`);
  return result;
}

export async function clearBookingsAction(businessId: string) {
  const { slug } = await guard(businessId);
  const removed = await clearDemoBookings(businessId);
  refresh(slug);
  revalidatePath(`/admin/negocios/${businessId}/editar`);
  return { removed };
}

export async function seedBookingsAction(businessId: string) {
  const { slug } = await guard(businessId);
  const created = await seedSampleBookings(businessId);
  refresh(slug);
  revalidatePath(`/admin/negocios/${businessId}/editar`);
  return { created };
}

/**
 * A shareable link is its own token rather than the bare /<slug>, so that
 * opening it tells me which lead looked and when. The public page is still
 * reachable directly — this only adds attribution when I choose to use it.
 */
export async function createShareAction(businessId: string, input: { label?: string; prospectId?: string }) {
  await guard(businessId);
  const share = await prisma.demoShare.create({
    data: {
      businessId,
      label: input.label?.trim() || null,
      prospectId: input.prospectId || null,
    },
  });
  revalidatePath(`/admin/negocios/${businessId}/editar`);
  return { token: share.token };
}

export async function deleteShareAction(businessId: string, shareId: string) {
  await guard(businessId);
  await prisma.demoShare.deleteMany({ where: { id: shareId, businessId } });
  revalidatePath(`/admin/negocios/${businessId}/editar`);
}
