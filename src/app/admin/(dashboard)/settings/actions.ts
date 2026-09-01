"use server";

import { revalidatePath } from "next/cache";
import { requireSession } from "@/lib/auth";
import { getBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { brandingSchema, businessSettingsSchema } from "@/lib/validations";

export async function updateBusinessProfile(input: unknown) {
  await requireSession();
  const parsed = businessSettingsSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const business = await getBusiness();
  const data = parsed.data;

  await prisma.business.update({
    where: { id: business.id },
    data: {
      ...data,
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

  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}

export async function updateBranding(input: unknown) {
  await requireSession();
  const parsed = brandingSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const business = await getBusiness();
  const data = parsed.data;

  await prisma.business.update({
    where: { id: business.id },
    data: {
      ...data,
      logoUrl: data.logoUrl || null,
      faviconUrl: data.faviconUrl || null,
    },
  });

  revalidatePath("/", "layout");
  revalidatePath("/admin", "layout");
}
