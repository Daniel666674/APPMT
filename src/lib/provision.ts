import type { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, setHours, setMinutes } from "date-fns";

/**
 * Creates the initial Business + owner login + a starter set of demo
 * services/staff/hours, so a fresh deployment isn't a blank, broken app on
 * first load. Safe to call more than once — if a Business already exists,
 * it's a no-op. Shared by prisma/seed.ts (local dev, via `tsx`) and
 * /api/setup (production, no local Node.js required) — takes a PrismaClient
 * as a parameter rather than importing the app's singleton, so it has no
 * dependency on Next.js-only modules and works in both contexts.
 */
export async function provisionBusiness(
  prisma: PrismaClient,
  opts: { ownerEmail: string; ownerPassword: string; businessName?: string }
): Promise<{ alreadyProvisioned: boolean; businessName: string; ownerEmail: string }> {
  const existingBusiness = await prisma.business.findFirst();
  if (existingBusiness) {
    return { alreadyProvisioned: true, businessName: existingBusiness.name, ownerEmail: opts.ownerEmail };
  }

  const businessName = opts.businessName?.trim() || "Bright & Co. Studio";
  const slug = businessName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "") || "business";

  const business = await prisma.business.create({
    data: {
      name: businessName,
      slug,
      primaryColor: "#4f46e5",
      accentColor: "#0ea5e9",
      fontFamily: "inter",
      themeMode: "light",
      heroHeadline: `Book your appointment with ${businessName}`,
      heroSubheadline: "Pick a service, choose a time that works for you, and you're all set.",
      aboutText:
        "We're a small team that cares about doing great work and treating every client like a regular. Walk-ins welcome, but booking ahead saves you the wait.",
      contactEmail: opts.ownerEmail,
      contactPhone: "(555) 123-4567",
      address: "123 Main Street, Springfield",
      timezone: "America/New_York",
      currency: "USD",
    },
  });

  const passwordHash = await bcrypt.hash(opts.ownerPassword, 12);
  await prisma.user.upsert({
    where: { email: opts.ownerEmail },
    update: {},
    create: { email: opts.ownerEmail, passwordHash, name: "Owner", role: "OWNER" },
  });

  const staffData = [
    { name: "Jordan Lee", email: "jordan@example.com", color: "#4f46e5" },
    { name: "Casey Rivera", email: "casey@example.com", color: "#0ea5e9" },
  ];
  const staff = [];
  for (const [index, s] of staffData.entries()) {
    staff.push(await prisma.staff.create({ data: { ...s, sortOrder: index, active: true } }));
  }

  const serviceData = [
    { name: "Haircut", description: "A classic cut, washed and styled.", durationMinutes: 30, price: 35, color: "#4f46e5" },
    { name: "Color Treatment", description: "Full color service with consultation.", durationMinutes: 90, price: 120, color: "#0ea5e9" },
    { name: "Beard Trim", description: "Shape-up and line edging.", durationMinutes: 15, price: 20, color: "#f97316" },
  ];
  const services = [];
  for (const [index, s] of serviceData.entries()) {
    services.push(await prisma.service.create({ data: { ...s, sortOrder: index, active: true } }));
  }

  for (const svc of services) {
    for (const st of staff) {
      await prisma.serviceStaff.create({ data: { serviceId: svc.id, staffId: st.id } });
    }
  }

  for (const st of staff) {
    await prisma.availability.createMany({
      data: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
        staffId: st.id,
        dayOfWeek,
        startMinute: 9 * 60,
        endMinute: 17 * 60,
      })),
    });
  }

  const demoCustomer = await prisma.customer.upsert({
    where: { email: "sample.customer@example.com" },
    update: {},
    create: { name: "Sam Customer", email: "sample.customer@example.com", phone: "(555) 987-6543" },
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
