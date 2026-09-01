import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, setHours, setMinutes } from "date-fns";
import { getIndustry } from "@/lib/industries";

/**
 * Creates the initial Business + owner login, plus a starter set of
 * services, staff and working hours drawn from the chosen industry preset,
 * so a fresh deployment opens as a believable demo of that vertical rather
 * than a blank app. Safe to call more than once — if a Business already
 * exists, it's a no-op.
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
  }
): Promise<{ alreadyProvisioned: boolean; businessName: string; ownerEmail: string }> {
  const existingBusiness = await prisma.business.findFirst();
  if (existingBusiness) {
    return { alreadyProvisioned: true, businessName: existingBusiness.name, ownerEmail: opts.ownerEmail };
  }

  const industry = getIndustry(opts.industryKey);
  const businessName = opts.businessName?.trim() || industry.defaultBusinessName;
  const slug =
    businessName
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "negocio";

  const business = await prisma.business.create({
    data: {
      name: businessName,
      slug,
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

  const staff = [];
  for (const [index, s] of industry.staff.entries()) {
    staff.push(await prisma.staff.create({ data: { ...s, sortOrder: index, active: true } }));
  }

  const services = [];
  for (const [index, s] of industry.services.entries()) {
    services.push(
      await prisma.service.create({
        data: {
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
  await prisma.user.upsert({
    where: { email: opts.ownerEmail },
    update: {},
    create: { email: opts.ownerEmail, passwordHash, name: "Propietario", role: "OWNER" },
  });

  // One booking on the calendar so the dashboard isn't empty at first login.
  const demoCustomer = await prisma.customer.upsert({
    where: { email: "cliente.ejemplo@correo.com" },
    update: {},
    create: { name: "Cliente de ejemplo", email: "cliente.ejemplo@correo.com", phone: "(300) 123 4567" },
  });

  const demoBookingStart = setMinutes(setHours(addDays(new Date(), 1), 10), 0);
  await prisma.booking.create({
    data: {
      serviceId: services[0]!.id,
      staffId: staff[0]!.id,
      customerId: demoCustomer.id,
      startsAt: demoBookingStart,
      endsAt: new Date(demoBookingStart.getTime() + services[0]!.durationMinutes * 60_000),
      status: "CONFIRMED",
    },
  });

  return { alreadyProvisioned: false, businessName: business.name, ownerEmail: opts.ownerEmail };
}
