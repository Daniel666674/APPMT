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
export async function provisionBusiness(
  prisma: PrismaClient,
  opts: {
    ownerEmail: string;
    ownerPassword: string;
    businessName?: string;
    industryKey?: string;
    listed?: boolean;
  }
): Promise<{ businessName: string; slug: string; ownerEmail: string }> {
  const existingUser = await prisma.user.findUnique({ where: { email: opts.ownerEmail } });
  if (existingUser) {
    throw new ProvisionError(
      `Ya existe una cuenta con el correo ${opts.ownerEmail}. Usa otro correo para este negocio.`
    );
  }

  const industry = getIndustry(opts.industryKey);
  const businessName = opts.businessName?.trim() || industry.defaultBusinessName;
  const slug = await findAvailableSlug(businessName);

  const business = await prisma.business.create({
    data: {
      name: businessName,
      slug,
      listed: opts.listed ?? true,
      primaryColor: industry.primaryColor,
      accentColor: industry.accentColor,
      fontFamily: "inter",
      themeMode: "light",
      heroHeadline: industry.heroHeadline.replace(industry.defaultBusinessName, businessName),
      heroSubheadline: industry.heroSubheadline.replace(industry.defaultBusinessName, businessName),
      aboutText: industry.aboutText,
      contactEmail: opts.ownerEmail,
      contactPhone: "(601) 123 4567",
      address: "Calle 123 #45-67, Bogotá",
      timezone: "America/Bogota",
      currency: "COP",
    },
  });

  const businessId = business.id;

  const staff = [];
  for (const [index, s] of industry.staff.entries()) {
    staff.push(await prisma.staff.create({ data: { ...s, businessId, sortOrder: index, active: true } }));
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

  // Monday–Saturday, 9:00–18:00.
  for (const st of staff) {
    await prisma.availability.createMany({
      data: [1, 2, 3, 4, 5, 6].map((dayOfWeek) => ({
        staffId: st.id,
        dayOfWeek,
        startMinute: 9 * 60,
        endMinute: 18 * 60,
      })),
    });
  }

  const passwordHash = await bcrypt.hash(opts.ownerPassword, 12);
  await prisma.user.create({
    data: { businessId, email: opts.ownerEmail, passwordHash, name: "Propietario", role: "OWNER" },
  });

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

  return { businessName: business.name, slug: business.slug, ownerEmail: opts.ownerEmail };
}
