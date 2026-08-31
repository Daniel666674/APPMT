import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, setHours, setMinutes } from "date-fns";

const prisma = new PrismaClient();

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? "owner@example.com";
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "changeme123";

async function main() {
  const existingBusiness = await prisma.business.findFirst();
  const business =
    existingBusiness ??
    (await prisma.business.create({
      data: {
        name: "Bright & Co. Studio",
        slug: "bright-and-co",
        primaryColor: "#4f46e5",
        accentColor: "#0ea5e9",
        fontFamily: "inter",
        themeMode: "light",
        heroHeadline: "Book your appointment with Bright & Co.",
        heroSubheadline: "Pick a service, choose a time that works for you, and you're all set.",
        aboutText:
          "We're a small team that cares about doing great work and treating every client like a regular. Walk-ins welcome, but booking ahead saves you the wait.",
        contactEmail: OWNER_EMAIL,
        contactPhone: "(555) 123-4567",
        address: "123 Main Street, Springfield",
        timezone: "America/New_York",
        currency: "USD",
      },
    }));

  const passwordHash = await bcrypt.hash(OWNER_PASSWORD, 12);
  await prisma.user.upsert({
    where: { email: OWNER_EMAIL },
    update: {},
    create: { email: OWNER_EMAIL, passwordHash, name: "Studio Owner", role: "OWNER" },
  });

  const staffData = [
    { name: "Jordan Lee", email: "jordan@example.com", color: "#4f46e5" },
    { name: "Casey Rivera", email: "casey@example.com", color: "#0ea5e9" },
  ];

  const staff = [];
  for (const [index, s] of staffData.entries()) {
    const existing = await prisma.staff.findFirst({ where: { name: s.name } });
    const created =
      existing ??
      (await prisma.staff.create({
        data: { ...s, sortOrder: index, active: true },
      }));
    staff.push(created);
  }

  const serviceData = [
    { name: "Haircut", description: "A classic cut, washed and styled.", durationMinutes: 30, price: 35, color: "#4f46e5" },
    { name: "Color Treatment", description: "Full color service with consultation.", durationMinutes: 90, price: 120, color: "#0ea5e9" },
    { name: "Beard Trim", description: "Shape-up and line edging.", durationMinutes: 15, price: 20, color: "#f97316" },
  ];

  const services = [];
  for (const [index, s] of serviceData.entries()) {
    const existing = await prisma.service.findFirst({ where: { name: s.name } });
    const created =
      existing ??
      (await prisma.service.create({
        data: { ...s, sortOrder: index, active: true },
      }));
    services.push(created);
  }

  // Both staff members can do everything in this demo dataset.
  for (const svc of services) {
    for (const st of staff) {
      await prisma.serviceStaff.upsert({
        where: { serviceId_staffId: { serviceId: svc.id, staffId: st.id } },
        update: {},
        create: { serviceId: svc.id, staffId: st.id },
      });
    }
  }

  // Monday–Friday 9am–5pm for everyone, seeded idempotently.
  for (const st of staff) {
    const existingBlocks = await prisma.availability.count({ where: { staffId: st.id } });
    if (existingBlocks === 0) {
      await prisma.availability.createMany({
        data: [1, 2, 3, 4, 5].map((dayOfWeek) => ({
          staffId: st.id,
          dayOfWeek,
          startMinute: 9 * 60,
          endMinute: 17 * 60,
        })),
      });
    }
  }

  // A couple of demo bookings so the admin dashboard isn't empty on first login.
  const demoCustomer = await prisma.customer.upsert({
    where: { email: "sample.customer@example.com" },
    update: {},
    create: { name: "Sam Customer", email: "sample.customer@example.com", phone: "(555) 987-6543" },
  });

  const demoBookingStart = setMinutes(setHours(addDays(new Date(), 1), 10), 0);
  await prisma.booking.upsert({
    where: { manageToken: "demo-booking-token" },
    update: {},
    create: {
      serviceId: services[0]!.id,
      staffId: staff[0]!.id,
      customerId: demoCustomer.id,
      startsAt: demoBookingStart,
      endsAt: new Date(demoBookingStart.getTime() + services[0]!.durationMinutes * 60_000),
      status: "CONFIRMED",
      manageToken: "demo-booking-token",
    },
  });

  console.log("\nSeed complete.");
  console.log(`Business: ${business.name}`);
  console.log(`Admin login: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log("Change this password immediately in production.\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
