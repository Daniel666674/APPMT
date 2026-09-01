"use server";

import { revalidatePath } from "next/cache";
import { requireBusinessSession } from "@/lib/auth";
import { RESERVED_SLUGS } from "@/lib/business";
import { prisma } from "@/lib/db";
import { brandingSchema, businessSettingsSchema } from "@/lib/validations";

export async function updateBusinessProfile(input: unknown) {
  const { business, businessId } = await requireBusinessSession();
  const parsed = businessSettingsSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const { slug, ...data } = parsed.data;

  // The slug is this business's public URL, so it has to stay unique across
  // the whole deployment and must not shadow one of the app's own routes.
  if (slug !== business.slug) {
    if (RESERVED_SLUGS.has(slug)) {
      throw new Error(`«${slug}» está reservada. Elige otra dirección web.`);
    }
    const taken = await prisma.business.findUnique({ where: { slug }, select: { id: true } });
    if (taken) throw new Error(`La dirección web «${slug}» ya está en uso. Elige otra.`);
  }

  await prisma.business.update({
    where: { id: businessId },
    data: {
      ...data,
      slug,
      contactEmail: data.contactEmail || null,
      contactPhone: data.contactPhone || null,
      address: data.address || null,
      website: data.website || null,
      instagramUrl: data.instagramUrl || null,
      facebookUrl: data.facebookUrl || null,
      heroHeadline: data.heroHeadline || null,
      heroSubheadline: data.heroSubheadline || null,
      aboutText: data.aboutText || null,
    },
  });

  revalidatePath("/");
  revalidatePath(`/${business.slug}`, "layout");
  if (slug !== business.slug) revalidatePath(`/${slug}`, "layout");
  revalidatePath("/admin", "layout");
}

export async function updateBranding(input: unknown) {
  const { business, businessId } = await requireBusinessSession();
  const parsed = brandingSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const data = parsed.data;

  await prisma.business.update({
    where: { id: businessId },
    data: {
      ...data,
      logoUrl: data.logoUrl || null,
      faviconUrl: data.faviconUrl || null,
    },
  });

  revalidatePath("/");
  revalidatePath(`/${business.slug}`, "layout");
  revalidatePath("/admin", "layout");
}
