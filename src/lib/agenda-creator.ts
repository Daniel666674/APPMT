import "server-only";
import { RESERVED_SLUGS, slugify } from "@/lib/business";
import { prisma } from "@/lib/db";
import { ProvisionError, provisionBusiness } from "@/lib/provision";
import { createAgendaSchema } from "@/lib/validations";

export interface CreatedAgenda {
  businessId: string;
  businessName: string;
  slug: string;
  ownerEmail: string | null;
}

/**
 * One code path behind both entry points to the creator: the SETUP_SECRET
 * page at /setup that bootstraps a deployment, and the console at
 * /admin/negocios once someone is signed in. Both validate the same way, so
 * an agenda made from either is identical.
 */
export async function createAgenda(input: unknown): Promise<CreatedAgenda> {
  const parsed = createAgendaSchema.safeParse(input);
  if (!parsed.success) {
    throw new ProvisionError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  const data = parsed.data;

  const slug = slugify(data.slug);
  if (RESERVED_SLUGS.has(slug)) {
    throw new ProvisionError(`«${slug}» es una dirección reservada. Elige otra.`);
  }
  const taken = await prisma.business.findUnique({ where: { slug }, select: { id: true } });
  if (taken) {
    throw new ProvisionError(`La dirección «/${slug}» ya está ocupada. Elige otra.`);
  }

  return provisionBusiness(prisma, {
    industryKey: data.industryKey,
    businessName: data.businessName,
    slug,
    listed: data.listed ?? true,
    primaryColor: data.primaryColor,
    accentColor: data.accentColor,
    fontFamily: data.fontFamily,
    cornerStyle: data.cornerStyle,
    themeMode: data.themeMode,
    logoUrl: data.logoUrl || undefined,
    heroImageUrl: data.heroImageUrl || undefined,
    heroHeadline: data.heroHeadline || undefined,
    heroSubheadline: data.heroSubheadline || undefined,
    city: data.city || undefined,
    address: data.address || undefined,
    contactPhone: data.contactPhone || undefined,
    whatsappNumber: data.whatsappNumber || undefined,
    openDays: data.openDays,
    openFromMinute: data.openFromMinute,
    openToMinute: data.openToMinute,
    staffNames: data.staffNames,
    createOwnerUser: data.createOwnerUser === true,
    ownerEmail: data.ownerEmail || undefined,
    ownerPassword: data.ownerPassword || undefined,
  });
}

/** Powers the live "/mi-negocio ya está libre" check in the creator. */
export async function checkSlug(raw: string) {
  const slug = slugify(raw);
  if (slug.length < 2) return { slug, available: false, reason: "Muy corta" };
  if (RESERVED_SLUGS.has(slug)) return { slug, available: false, reason: "Dirección reservada" };
  const taken = await prisma.business.findUnique({ where: { slug }, select: { id: true } });
  return taken ? { slug, available: false, reason: "Ya está ocupada" } : { slug, available: true };
}
