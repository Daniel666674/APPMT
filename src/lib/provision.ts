import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, setHours, setMinutes } from "date-fns";
import { getIndustry } from "@/lib/industries";
import { findAvailableSlug } from "@/lib/business";

export class ProvisionError extends Error {}

/**
 * Creates one new business: its profile, an owner login, and a starter set of
 * services, staff and working hours drawn from the chosen industry preset, so
 * it opens as a believable demo of that vertical rather than a blank page.
 *
 * Every record it writes carries the new businessId, so the tenant is
 * self-contained from the moment it exists.
 *
 * Takes a PrismaClient as a parameter rather than importing the app's
 * singleton, so it works both inside Next.js (/api/setup) and from a plain
 * script (prisma/seed.ts via tsx).
 */
export interface ProvisionInput {
  /**
   * Login for this business's own admin. Omit both (with createOwnerUser
   * false) for a demo agenda: demos carry no login of their own, because the
   * platform admin already reaches every business from one account. That is
   * what lets every demo share "the same email and password" — there is only
   * ever one account, not ten copies of it, and User.email is unique.
   */
  ownerEmail?: string;
  ownerPassword?: string;
  /** Defaults to true. False creates the agenda with no login attached. */
  createOwnerUser?: boolean;
  businessName?: string;
  industryKey?: string;
  listed?: boolean;
  /** Chosen in the creator; falls back to the industry preset. */
  slug?: string;
  primaryColor?: string;
  accentColor?: string;
  fontFamily?: string;
  cornerStyle?: string;
  themeMode?: string;
  logoUrl?: string;
  heroImageUrl?: string;
  heroHeadline?: string;
  heroSubheadline?: string;
  aboutText?: string;
  contactPhone?: string;
  whatsappNumber?: string;
  address?: string;
  city?: string;
  /** Opening hours applied to every starter staff member. */
  openDays?: number[];
  openFromMinute?: number;
  openToMinute?: number;
  /** Names for the starter team; falls back to the industry preset. */
  staffNames?: string[];
  /** Skips the sample customer and booking — for a client going straight live. */
  withSampleBooking?: boolean;
}

export async function provisionBusiness(
  prisma: PrismaClient,
  opts: ProvisionInput
): Promise<{ businessId: string; businessName: string; slug: string; ownerEmail: string | null }> {
  const wantsOwner = opts.createOwnerUser !== false;

  if (wantsOwner) {
    if (!opts.ownerEmail || !opts.ownerPassword) {
      throw new ProvisionError("Falta el correo o la contraseña del administrador de este negocio.");
    }
    const existingUser = await prisma.user.findUnique({ where: { email: opts.ownerEmail } });
    if (existingUser) {
      throw new ProvisionError(
        `Ya existe una cuenta con el correo ${opts.ownerEmail}. Usa otro correo para este negocio.`
      );
    }
  }

  const industry = getIndustry(opts.industryKey);
  const businessName = opts.businessName?.trim() || industry.defaultBusinessName;
  const slug = await findAvailableSlug(opts.slug?.trim() || businessName);

  const business = await prisma.business.create({
    data: {
      name: businessName,
      slug,
      listed: opts.listed ?? true,
      primaryColor: opts.primaryColor || industry.primaryColor,
      accentColor: opts.accentColor || industry.accentColor,
      fontFamily: opts.fontFamily || "inter",
      cornerStyle: opts.cornerStyle || "soft",
      themeMode: opts.themeMode || "light",
      logoUrl: opts.logoUrl || null,
      heroImageUrl: opts.heroImageUrl || null,
      heroHeadline:
        opts.heroHeadline?.trim() ||
        industry.heroHeadline.replace(industry.defaultBusinessName, businessName),
      heroSubheadline:
        opts.heroSubheadline?.trim() ||
        industry.heroSubheadline.replace(industry.defaultBusinessName, businessName),
      aboutText: opts.aboutText?.trim() || industry.aboutText,
      contactEmail: opts.ownerEmail ?? null,
      contactPhone: opts.contactPhone?.trim() || null,
      whatsappNumber: normalizeWhatsapp(opts.whatsappNumber),
      address: opts.address?.trim() || null,
      city: opts.city?.trim() || null,
      timezone: "America/Bogota",
      currency: "COP",
    },
  });

  const businessId = business.id;

  const chosenNames = opts.staffNames?.map((n) => n.trim()).filter(Boolean) ?? [];
  const team = chosenNames.length
    ? chosenNames.map((name, i) => ({ name, color: industry.staff[i % industry.staff.length]!.color }))
    : industry.staff;

  const staff = [];
  for (const [index, member] of team.entries()) {
    staff.push(await prisma.staff.create({ data: { ...member, businessId, sortOrder: index, active: true } }));
  }

  const services = [];
  for (const [index, s] of industry.services.entries()) {
    services.push(
      await prisma.service.create({
        data: {
          businessId,
          name: s.name,
          description: s.description,
          durationMinutes: s.durationMinutes,
          price: s.price,
          color: s.color,
          sortOrder: index,
          active: true,
        },
      })
    );
  }

  // Everyone on the team can perform every service in the demo data.
  for (const svc of services) {
    for (const st of staff) {
      await prisma.serviceStaff.create({ data: { serviceId: svc.id, staffId: st.id } });
    }
  }

  // Opening hours from the creator, defaulting to Monday–Saturday 9:00–18:00.
  const openDays = opts.openDays?.length ? opts.openDays : [1, 2, 3, 4, 5, 6];
  const openFrom = opts.openFromMinute ?? 9 * 60;
  const openTo = opts.openToMinute ?? 18 * 60;
  for (const st of staff) {
    await prisma.availability.createMany({
      data: openDays.map((dayOfWeek) => ({
        staffId: st.id,
        dayOfWeek,
        startMinute: openFrom,
        endMinute: openTo,
      })),
    });
  }

  if (wantsOwner) {
    const passwordHash = await bcrypt.hash(opts.ownerPassword!, 12);
    // Whoever creates the very first account runs the deployment, so they get
    // platform access. Every later account is scoped to its own business.
    const isFirstUserEver = (await prisma.user.count()) === 0;
    await prisma.user.create({
      data: {
        businessId,
        email: opts.ownerEmail!,
        passwordHash,
        name: "Propietario",
        role: "OWNER",
        isPlatformAdmin: isFirstUserEver,
      },
    });
  }

  if (opts.withSampleBooking === false) {
    return { businessId, businessName: business.name, slug: business.slug, ownerEmail: opts.ownerEmail ?? null };
  }

  // One booking on the calendar so the dashboard isn't empty at first login.
  const demoCustomer = await prisma.customer.create({
    data: {
      businessId,
      name: "Cliente de ejemplo",
      email: `cliente.ejemplo+${slug}@correo.com`,
      phone: "(300) 123 4567",
    },
  });

  const demoBookingStart = setMinutes(setHours(addDays(new Date(), 1), 10), 0);
  await prisma.booking.create({
    data: {
      businessId,
      serviceId: services[0]!.id,
      staffId: staff[0]!.id,
      customerId: demoCustomer.id,
      startsAt: demoBookingStart,
      endsAt: new Date(demoBookingStart.getTime() + services[0]!.durationMinutes * 60_000),
      status: "CONFIRMED",
    },
  });

  return { businessId, businessName: business.name, slug: business.slug, ownerEmail: opts.ownerEmail ?? null };
}

/** Keeps only digits so the wa.me link always works, whatever the client typed. */
function normalizeWhatsapp(input: string | undefined) {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  // A bare Colombian mobile (3xx xxx xxxx) gets the country code it needs.
  return digits.length === 10 && digits.startsWith("3") ? `57${digits}` : digits;
}
