import "server-only";
import type { Prisma } from "@prisma/client";
import { addDays, setHours, setMinutes, startOfDay } from "date-fns";
import { prisma } from "@/lib/db";
import { RESERVED_SLUGS, findAvailableSlug, slugify } from "@/lib/business";
import { getIndustry, INDUSTRIES } from "@/lib/industries";
import { demoBuilderSchema, type DemoBuilderInput } from "@/lib/validations";

export class DemoBuilderError extends Error {}

/** Everything the builder screen needs, in one round trip. */
export async function loadDemo(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) return null;

  const [services, staff, availability, shares, bookingCount, lastBooking, prospects] =
    await Promise.all([
      prisma.service.findMany({
        where: { businessId },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { bookings: true } } },
      }),
      prisma.staff.findMany({
        where: { businessId },
        orderBy: { sortOrder: "asc" },
        include: { _count: { select: { bookings: true } } },
      }),
      prisma.availability.findMany({
        where: { staff: { businessId } },
        orderBy: [{ dayOfWeek: "asc" }, { startMinute: "asc" }],
      }),
      prisma.demoShare.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        include: { prospect: { select: { id: true, name: true, company: true } } },
      }),
      prisma.booking.count({ where: { businessId } }),
      prisma.booking.findFirst({ where: { businessId }, orderBy: { createdAt: "desc" } }),
      prisma.prospect.findMany({
        where: { businessId },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true, company: true, status: true },
      }),
    ]);

  // The builder edits one set of opening hours for the whole agenda. Which
  // days and hours those are is read off the team, taking the widest span
  // anyone works — an agenda with mixed schedules still opens with something
  // true rather than blank, and saving normalises everyone onto it.
  const openDays = [...new Set(availability.map((a) => a.dayOfWeek))].sort();
  const openFromMinute = availability.length ? Math.min(...availability.map((a) => a.startMinute)) : 9 * 60;
  const openToMinute = availability.length ? Math.max(...availability.map((a) => a.endMinute)) : 18 * 60;
  const mixedSchedules =
    staff.length > 1 &&
    availability.some(
      (a) => a.startMinute !== openFromMinute || a.endMinute !== openToMinute
    );

  return {
    business,
    services,
    staff,
    shares,
    prospects,
    stats: {
      bookings: bookingCount,
      views: business.viewCount,
      lastViewedAt: business.lastViewedAt,
      lastBookingAt: lastBooking?.createdAt ?? null,
    },
    hours: {
      openDays: openDays.length ? openDays : [1, 2, 3, 4, 5, 6],
      openFromMinute,
      openToMinute,
      mixedSchedules,
    },
  };
}

export type LoadedDemo = NonNullable<Awaited<ReturnType<typeof loadDemo>>>;

/**
 * Saves the whole agenda at once.
 *
 * Two rules make this safe to run against an agenda that already took real
 * bookings: a service or staff member that has bookings is never deleted,
 * only deactivated (the booking rows point at it, and history is not ours to
 * erase), and the opening hours are rewritten wholesale so the saved state is
 * exactly what the screen showed.
 */
export async function saveDemo(businessId: string, input: unknown) {
  const parsed = demoBuilderSchema.safeParse(input);
  if (!parsed.success) {
    throw new DemoBuilderError(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }
  const data: DemoBuilderInput = parsed.data;

  const current = await prisma.business.findUnique({
    where: { id: businessId },
    select: { slug: true },
  });
  if (!current) throw new DemoBuilderError("Esta agenda ya no existe.");

  const slug = slugify(data.slug);
  if (slug !== current.slug) {
    if (RESERVED_SLUGS.has(slug)) {
      throw new DemoBuilderError(`«${slug}» es una dirección reservada. Elige otra.`);
    }
    const taken = await prisma.business.findUnique({ where: { slug }, select: { id: true } });
    if (taken) throw new DemoBuilderError(`La dirección «/${slug}» ya está ocupada. Elige otra.`);
  }

  await prisma.$transaction(
    async (tx) => {
      await tx.business.update({
        where: { id: businessId },
        data: {
          name: data.name,
          slug,
          listed: data.listed,
          internalNotes: data.internalNotes || null,
          primaryColor: data.primaryColor,
          accentColor: data.accentColor,
          fontFamily: data.fontFamily,
          cornerStyle: data.cornerStyle,
          themeMode: data.themeMode,
          logoUrl: data.logoUrl || null,
          faviconUrl: data.faviconUrl || null,
          heroImageUrl: data.heroImageUrl || null,
          heroHeadline: data.heroHeadline || null,
          heroSubheadline: data.heroSubheadline || null,
          aboutText: data.aboutText || null,
          contactEmail: data.contactEmail || null,
          contactPhone: data.contactPhone || null,
          whatsappNumber: normalizeWhatsapp(data.whatsappNumber),
          address: data.address || null,
          city: data.city || null,
          website: data.website || null,
          instagramUrl: data.instagramUrl || null,
          facebookUrl: data.facebookUrl || null,
          bookingSlotIntervalMinutes: data.bookingSlotIntervalMinutes,
          bookingBufferMinutes: data.bookingBufferMinutes,
          minNoticeMinutes: data.minNoticeMinutes,
          maxAdvanceDays: data.maxAdvanceDays,
          requirePhone: data.requirePhone,
          cancellationWindowHours: data.cancellationWindowHours,
        },
      });

      const staffIds = await syncStaff(tx, businessId, data);
      const serviceIds = await syncServices(tx, businessId, data);

      // In a demo everyone can do everything: it keeps the booking flow from
      // dead-ending on a service nobody is assigned to, which is the fastest
      // way to lose a prospect mid-demo.
      await tx.serviceStaff.deleteMany({ where: { service: { businessId } } });
      if (serviceIds.length && staffIds.length) {
        await tx.serviceStaff.createMany({
          data: serviceIds.flatMap((serviceId) => staffIds.map((staffId) => ({ serviceId, staffId }))),
          skipDuplicates: true,
        });
      }

      await tx.availability.deleteMany({ where: { staff: { businessId } } });
      if (staffIds.length) {
        await tx.availability.createMany({
          data: staffIds.flatMap((staffId) =>
            data.openDays.map((dayOfWeek) => ({
              staffId,
              dayOfWeek,
              startMinute: data.openFromMinute,
              endMinute: data.openToMinute,
            }))
          ),
        });
      }
    },
    { timeout: 20_000 }
  );

  return { slug, previousSlug: current.slug };
}

/** Returns the ids of every ACTIVE staff member after the save. */
async function syncStaff(tx: Prisma.TransactionClient, businessId: string, data: DemoBuilderInput) {
  const existing = await tx.staff.findMany({
    where: { businessId },
    select: { id: true, _count: { select: { bookings: true } } },
  });
  const kept = new Set(data.staff.map((s) => s.id).filter(Boolean) as string[]);
  const activeIds: string[] = [];

  for (const [index, member] of data.staff.entries()) {
    const payload = {
      name: member.name,
      bio: member.bio || null,
      avatarUrl: member.avatarUrl || null,
      color: member.color,
      active: member.active,
      sortOrder: index,
    };
    if (member.id) {
      await tx.staff.update({ where: { id: member.id }, data: payload });
      if (member.active) activeIds.push(member.id);
    } else {
      const created = await tx.staff.create({ data: { ...payload, businessId } });
      if (member.active) activeIds.push(created.id);
    }
  }

  for (const row of existing) {
    if (kept.has(row.id)) continue;
    // Bookings point at this person. Deleting would take their history with
    // them, so they are retired instead — invisible on the booking page,
    // still attached to the appointments they served.
    if (row._count.bookings > 0) {
      await tx.staff.update({ where: { id: row.id }, data: { active: false } });
    } else {
      await tx.staff.delete({ where: { id: row.id } });
    }
  }

  return activeIds;
}

/** Returns the ids of every ACTIVE service after the save. */
async function syncServices(tx: Prisma.TransactionClient, businessId: string, data: DemoBuilderInput) {
  const existing = await tx.service.findMany({
    where: { businessId },
    select: { id: true, _count: { select: { bookings: true } } },
  });
  const kept = new Set(data.services.map((s) => s.id).filter(Boolean) as string[]);
  const activeIds: string[] = [];

  for (const [index, service] of data.services.entries()) {
    const payload = {
      name: service.name,
      description: service.description || null,
      durationMinutes: service.durationMinutes,
      price: service.price,
      color: service.color,
      active: service.active,
      sortOrder: index,
    };
    if (service.id) {
      await tx.service.update({ where: { id: service.id }, data: payload });
      if (service.active) activeIds.push(service.id);
    } else {
      const created = await tx.service.create({ data: { ...payload, businessId } });
      if (service.active) activeIds.push(created.id);
    }
  }

  for (const row of existing) {
    if (kept.has(row.id)) continue;
    if (row._count.bookings > 0) {
      await tx.service.update({ where: { id: row.id }, data: { active: false } });
    } else {
      await tx.service.delete({ where: { id: row.id } });
    }
  }

  return activeIds;
}

/**
 * Puts a demo back the way it shipped: the sector preset's services, prices,
 * team and hours, with the agenda's own name and URL untouched. This is the
 * undo for a demo I improvised on during a call.
 */
export async function resetDemoToPreset(businessId: string) {
  const business = await prisma.business.findUnique({ where: { id: businessId } });
  if (!business) throw new DemoBuilderError("Esta agenda ya no existe.");

  const bookings = await prisma.booking.count({ where: { businessId } });
  if (bookings > 0) {
    throw new DemoBuilderError(
      "Esta agenda ya tiene citas. Borra primero las citas de prueba para poder restablecerla."
    );
  }

  const industry = getIndustry(business.industryKey ?? guessIndustryKey(business.name));

  await prisma.$transaction(
    async (tx) => {
      await tx.serviceStaff.deleteMany({ where: { service: { businessId } } });
      await tx.availability.deleteMany({ where: { staff: { businessId } } });
      await tx.service.deleteMany({ where: { businessId } });
      await tx.staff.deleteMany({ where: { businessId } });

      await tx.business.update({
        where: { id: businessId },
        data: {
          industryKey: industry.key,
          primaryColor: industry.primaryColor,
          accentColor: industry.accentColor,
          fontFamily: "inter",
          cornerStyle: "soft",
          themeMode: "light",
          heroHeadline: industry.heroHeadline.replace(industry.defaultBusinessName, business.name),
          heroSubheadline: industry.heroSubheadline.replace(industry.defaultBusinessName, business.name),
          aboutText: industry.aboutText,
        },
      });

      const staffIds: string[] = [];
      for (const [index, member] of industry.staff.entries()) {
        const created = await tx.staff.create({
          data: { ...member, businessId, sortOrder: index, active: true },
        });
        staffIds.push(created.id);
      }

      const serviceIds: string[] = [];
      for (const [index, s] of industry.services.entries()) {
        const created = await tx.service.create({
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
        });
        serviceIds.push(created.id);
      }

      await tx.serviceStaff.createMany({
        data: serviceIds.flatMap((serviceId) => staffIds.map((staffId) => ({ serviceId, staffId }))),
        skipDuplicates: true,
      });
      await tx.availability.createMany({
        data: staffIds.flatMap((staffId) =>
          [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
            staffId,
            dayOfWeek,
            startMinute: 9 * 60,
            endMinute: 18 * 60,
          }))
        ),
      });
    },
    { timeout: 20_000 }
  );

  return { industryKey: industry.key, label: industry.label };
}

/** Best guess at the sector of an agenda created before industryKey existed. */
function guessIndustryKey(name: string) {
  const haystack = name.toLowerCase();
  const match = INDUSTRIES.find(
    (i) =>
      haystack.includes(i.label.toLowerCase().split(" ")[0]!) ||
      i.defaultBusinessName.toLowerCase() === haystack
  );
  return match?.key;
}

/**
 * Copies an agenda whole — brand, copy, services, team, hours — under a new
 * name and a free URL. Bookings, customers and any owner login are NOT
 * copied: the copy is a fresh demo, not a clone of someone's business.
 */
export async function duplicateDemo(businessId: string, newName?: string) {
  const source = await loadDemo(businessId);
  if (!source) throw new DemoBuilderError("Esta agenda ya no existe.");

  const name = newName?.trim() || `${source.business.name} (copia)`;
  const slug = await findAvailableSlug(name);

  // Everything about the source agenda except its identity and timestamps,
  // so a column added to Business later is copied without touching this.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, createdAt: _c, updatedAt: _u, ...brand } = source.business;

  const created = await prisma.$transaction(
    async (tx) => {
      const copy = await tx.business.create({
        data: { ...brand, name, slug, viewCount: 0, lastViewedAt: null },
      });

      const staffIds: string[] = [];
      for (const member of source.staff) {
        const made = await tx.staff.create({
          data: {
            businessId: copy.id,
            name: member.name,
            email: member.email,
            phone: member.phone,
            bio: member.bio,
            avatarUrl: member.avatarUrl,
            color: member.color,
            active: member.active,
            sortOrder: member.sortOrder,
          },
        });
        staffIds.push(made.id);
      }

      const serviceIds: string[] = [];
      for (const service of source.services) {
        const made = await tx.service.create({
          data: {
            businessId: copy.id,
            name: service.name,
            description: service.description,
            durationMinutes: service.durationMinutes,
            price: service.price,
            color: service.color,
            active: service.active,
            sortOrder: service.sortOrder,
          },
        });
        serviceIds.push(made.id);
      }

      await tx.serviceStaff.createMany({
        data: serviceIds.flatMap((serviceId) => staffIds.map((staffId) => ({ serviceId, staffId }))),
        skipDuplicates: true,
      });
      await tx.availability.createMany({
        data: staffIds.flatMap((staffId) =>
          source.hours.openDays.map((dayOfWeek) => ({
            staffId,
            dayOfWeek,
            startMinute: source.hours.openFromMinute,
            endMinute: source.hours.openToMinute,
          }))
        ),
      });

      return copy;
    },
    { timeout: 20_000 }
  );

  return { businessId: created.id, slug: created.slug, name: created.name };
}

/** Wipes every booking and customer on a demo. Only ever run on my own demos. */
export async function clearDemoBookings(businessId: string) {
  const [bookings] = await prisma.$transaction([
    prisma.booking.deleteMany({ where: { businessId } }),
    prisma.customer.deleteMany({ where: { businessId } }),
  ]);
  return bookings.count;
}

const SAMPLE_NAMES = [
  "Camila Restrepo",
  "Andrés Gaitán",
  "Laura Mejía",
  "Juan Pablo Ortiz",
  "Valentina Cifuentes",
  "Santiago Ruiz",
  "Daniela Herrera",
  "Mateo Villamil",
  "Sofía Cárdenas",
  "Nicolás Peña",
  "Isabella Rojas",
  "Sebastián Lozano",
];

/**
 * Fills the coming week with believable appointments.
 *
 * An empty calendar is the fastest way to make a demo look dead on a call,
 * so this exists purely for selling. It respects the agenda's real opening
 * hours and never double-books: the database's exclusion constraint would
 * refuse an overlap anyway, so a clash is skipped rather than retried.
 */
export async function seedSampleBookings(businessId: string, days = 7) {
  const demo = await loadDemo(businessId);
  if (!demo) throw new DemoBuilderError("Esta agenda ya no existe.");

  const services = demo.services.filter((s) => s.active);
  const staff = demo.staff.filter((s) => s.active);
  if (!services.length || !staff.length) {
    throw new DemoBuilderError("Esta agenda necesita al menos un servicio y una persona activos.");
  }

  const { openDays, openFromMinute, openToMinute } = demo.hours;
  let created = 0;
  let nameIndex = 0;

  for (let dayOffset = 0; dayOffset < days; dayOffset++) {
    const day = startOfDay(addDays(new Date(), dayOffset));
    if (!openDays.includes(day.getDay())) continue;

    // Two or three appointments a day reads as a business with traffic
    // without filling the grid so completely that no slot is left to book
    // live during the demo.
    const perDay = 2 + (dayOffset % 2);
    for (let i = 0; i < perDay; i++) {
      const service = services[(dayOffset + i) % services.length]!;
      const member = staff[(dayOffset + i) % staff.length]!;
      const slot = openFromMinute + ((i * 3 + dayOffset) % 8) * 60;
      if (slot + service.durationMinutes > openToMinute) continue;

      const startsAt = setMinutes(setHours(day, Math.floor(slot / 60)), slot % 60);
      if (startsAt.getTime() < Date.now()) continue;

      const name = SAMPLE_NAMES[nameIndex++ % SAMPLE_NAMES.length]!;
      const email = `${slugify(name)}@ejemplo.com`;

      try {
        const customer = await prisma.customer.upsert({
          where: { businessId_email: { businessId, email } },
          update: {},
          create: { businessId, name, email, phone: "3001234567" },
        });
        await prisma.booking.create({
          data: {
            businessId,
            serviceId: service.id,
            staffId: member.id,
            customerId: customer.id,
            startsAt,
            endsAt: new Date(startsAt.getTime() + service.durationMinutes * 60_000),
            status: "CONFIRMED",
          },
        });
        created++;
      } catch {
        // An overlap the exclusion constraint refused. Skipping is correct:
        // the point is a full-looking week, not this exact slot.
      }
    }
  }

  return created;
}

function normalizeWhatsapp(input: string | undefined) {
  if (!input) return null;
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;
  return digits.length === 10 && digits.startsWith("3") ? `57${digits}` : digits;
}
