/**
 * Tenant isolation: the authenticated surface (admin server actions).
 *
 * These are the tests that back the multi-tenancy claim: one deployment
 * serves many businesses, and no business can see or touch another's data.
 *
 * Prerequisites (see tests/README.md):
 *   1. a seeded database with at least two businesses  (npm run db:seed)
 *   2. a production build running on TEST_URL          (npm run build && npm start)
 *   3. TEST_DATABASE_URL and SESSION_SECRET matching that server's env
 *
 * Run with:  node tests/tenant-isolation-actions.mjs
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { SignJWT } from "jose";

// Server actions are addressed by the ids Next.js assigns at build time, so
// this reads them straight out of the build manifest and calls the real
// actions the admin UI calls — with another business's ids.
const BASE = process.env.TEST_URL ?? "http://localhost:3100";
const DB = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const SECRET = process.env.SESSION_SECRET;
if (!DB || !SECRET) {
  console.error("Set TEST_DATABASE_URL (or DATABASE_URL) and SESSION_SECRET to the values the server under test is using.");
  process.exit(2);
}
const prisma = new PrismaClient({ datasources: { db: { url: DB } } });

const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")).node;
const actions = {};
for (const [id, v] of Object.entries(manifest)) {
  actions[v.exportedName] = { id, page: Object.keys(v.workers)[0] };
}
const pageUrl = (p) =>
  BASE + "/" + p.replace(/^app/, "").replace(/\/page$/, "").replace(/\(\w+\)\//g, "").replace(/^\//, "");

let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
}

const [A, B] = await prisma.business.findMany({ orderBy: { createdAt: "asc" }, take: 2 });
const grab = async (b) => ({
  service: await prisma.service.findFirst({ where: { businessId: b.id } }),
  staff: await prisma.staff.findFirst({ where: { businessId: b.id } }),
  booking: await prisma.booking.findFirst({ where: { businessId: b.id } }),
  user: await prisma.user.findFirst({ where: { businessId: b.id } }),
});
const a = await grab(A), bb = await grab(B);

// updateBusinessProfile writes every column the form owns, so a partial
// payload blanks the rest. Snapshot A's row and put it back at the end.
const snapshotA = await prisma.business.findUnique({ where: { id: A.id } });
const restoreA = { ...snapshotA };
delete restoreA.id;
delete restoreA.createdAt;
delete restoreA.updatedAt;
const profile = (over) => ({
  name: A.name, timezone: A.timezone, currency: A.currency,
  contactEmail: snapshotA.contactEmail ?? "", contactPhone: snapshotA.contactPhone ?? "",
  address: snapshotA.address ?? "", website: snapshotA.website ?? "",
  instagramUrl: snapshotA.instagramUrl ?? "", facebookUrl: snapshotA.facebookUrl ?? "",
  heroHeadline: snapshotA.heroHeadline ?? "", heroSubheadline: snapshotA.heroSubheadline ?? "",
  aboutText: snapshotA.aboutText ?? "",
  bookingSlotIntervalMinutes: snapshotA.bookingSlotIntervalMinutes,
  bookingBufferMinutes: snapshotA.bookingBufferMinutes,
  minNoticeMinutes: snapshotA.minNoticeMinutes,
  maxAdvanceDays: snapshotA.maxAdvanceDays,
  requirePhone: snapshotA.requirePhone,
  cancellationWindowHours: snapshotA.cancellationWindowHours,
  listed: snapshotA.listed,
  slug: A.slug,
  ...over,
});

const secret = new TextEncoder().encode(SECRET);
const token = await new SignJWT({
  userId: a.user.id, email: a.user.email, name: a.user.name, role: a.user.role, businessId: A.id,
}).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);

/** Invokes a real server action as business A's signed-in owner. */
async function callAction(name, args) {
  const { id, page } = actions[name];
  const res = await fetch(pageUrl(page), {
    method: "POST",
    headers: {
      cookie: `appmt_session=${token}`,
      "Next-Action": id,
      "Content-Type": "text/plain;charset=UTF-8",
    },
    body: JSON.stringify(args),
    redirect: "manual",
  });
  return { status: res.status, body: await res.text() };
}
// A server action that throws surfaces the error in the RSC payload rather
// than as a non-2xx status, so "rejected" means the write did not happen.
const rejected = (r, needle) => r.body.includes(needle) || r.body.includes('"digest"');

console.log(`\nSigned in as ${A.name} (/${A.slug}); target is ${B.name} (/${B.slug})\n`);
console.log("── Admin server actions with another tenant's ids ──────");

{
  const before = await prisma.staff.findUnique({ where: { id: bb.staff.id } });
  const r = await callAction("toggleStaffActive", [bb.staff.id, !before.active]);
  const after = await prisma.staff.findUnique({ where: { id: bb.staff.id } });
  check("toggleStaffActive refuses B's staff", after.active === before.active, `status=${r.status}`);
  check("  …and reports it as not found", rejected(r, "Persona no encontrada"));
}
{
  const r = await callAction("deleteStaff", [bb.staff.id]);
  const still = await prisma.staff.findUnique({ where: { id: bb.staff.id } });
  check("deleteStaff refuses B's staff", still !== null, `status=${r.status}`);
}
{
  const before = await prisma.service.findUnique({ where: { id: bb.service.id } });
  const r = await callAction("toggleServiceActive", [bb.service.id, !before.active]);
  const after = await prisma.service.findUnique({ where: { id: bb.service.id } });
  check("toggleServiceActive refuses B's service", after.active === before.active, `status=${r.status}`);
  check("  …and reports it as not found", rejected(r, "Servicio no encontrado"));
}
{
  const r = await callAction("deleteService", [bb.service.id]);
  const still = await prisma.service.findUnique({ where: { id: bb.service.id } });
  check("deleteService refuses B's service", still !== null, `status=${r.status}`);
}
{
  const before = await prisma.service.findUnique({ where: { id: bb.service.id } });
  await callAction("updateService", [bb.service.id, {
    name: "SECUESTRADO", durationMinutes: 30, price: 1, active: true, staffIds: [],
  }]);
  const after = await prisma.service.findUnique({ where: { id: bb.service.id } });
  check("updateService cannot rename B's service", after.name === before.name, `name=${after.name}`);
}
{
  const before = await prisma.staff.findUnique({ where: { id: bb.staff.id } });
  await callAction("updateStaff", [bb.staff.id, { name: "SECUESTRADO", active: true, serviceIds: [] }]);
  const after = await prisma.staff.findUnique({ where: { id: bb.staff.id } });
  check("updateStaff cannot rename B's staff", after.name === before.name, `name=${after.name}`);
}
{
  const before = await prisma.availability.count({ where: { staffId: bb.staff.id } });
  await callAction("saveWeeklyAvailability", [bb.staff.id, { blocks: [] }]);
  const after = await prisma.availability.count({ where: { staffId: bb.staff.id } });
  check("saveWeeklyAvailability cannot wipe B's hours", after === before, `${before} -> ${after}`);
}
{
  const before = await prisma.booking.findUnique({ where: { id: bb.booking.id } });
  await callAction("updateAppointmentStatus", [bb.booking.id, "CANCELLED"]);
  const after = await prisma.booking.findUnique({ where: { id: bb.booking.id } });
  check("updateAppointmentStatus cannot cancel B's booking", after.status === before.status, `status=${after.status}`);
}
{
  // Book into B's calendar while signed in as A.
  const start = new Date(Date.now() + 5 * 864e5);
  start.setUTCHours(15, 0, 0, 0);
  const before = await prisma.booking.count({ where: { businessId: B.id } });
  await callAction("createAppointment", [{
    serviceId: bb.service.id, staffId: bb.staff.id, startsAt: start.toISOString(),
    customerName: "Intruso", customerEmail: "intruso.action@example.com",
  }]);
  const after = await prisma.booking.count({ where: { businessId: B.id } });
  check("createAppointment cannot write into B's calendar", after === before, `${before} -> ${after}`);
  const leaked = await prisma.customer.count({ where: { email: "intruso.action@example.com", businessId: B.id } });
  check("  …and creates no customer under B", leaked === 0);
}
{
  // Settings writes are keyed off the session, never off a submitted id.
  const beforeB = await prisma.business.findUnique({ where: { id: B.id } });
  await callAction("updateBusinessProfile", [profile({ name: "SECUESTRADO", slug: "secuestrado" })]);
  const afterB = await prisma.business.findUnique({ where: { id: B.id } });
  const afterA = await prisma.business.findUnique({ where: { id: A.id } });
  check("updateBusinessProfile leaves B untouched", afterB.name === beforeB.name && afterB.slug === beforeB.slug);
  check("  …and applies only to A", afterA.name === "SECUESTRADO" && afterA.slug === "secuestrado");
  // put A back
  await prisma.business.update({ where: { id: A.id }, data: restoreA });
}

console.log("\n── Slug rules ─────────────────────────────────────────");
{
  await callAction("updateBusinessProfile", [profile({ slug: "admin" })]);
  const after = await prisma.business.findUnique({ where: { id: A.id } });
  check("a reserved slug is refused", after.slug === A.slug, `slug=${after.slug}`);
}
{
  await callAction("updateBusinessProfile", [profile({ slug: B.slug })]);
  const after = await prisma.business.findUnique({ where: { id: A.id } });
  check("a slug already taken by B is refused", after.slug === A.slug, `slug=${after.slug}`);
}
{
  await callAction("updateBusinessProfile", [profile({ slug: "mi-salon-nuevo" })]);
  const after = await prisma.business.findUnique({ where: { id: A.id } });
  check("a free slug is accepted", after.slug === "mi-salon-nuevo", `slug=${after.slug}`);
  const page = await fetch(`${BASE}/mi-salon-nuevo`);
  check("  …and the new URL serves A's page", page.status === 200, `status=${page.status}`);
  await prisma.business.update({ where: { id: A.id }, data: restoreA });
}

// Leave the database exactly as it was found.
await prisma.business.update({ where: { id: A.id }, data: restoreA });
await prisma.booking.deleteMany({ where: { customer: { email: "intruso.action@example.com" } } });
await prisma.customer.deleteMany({ where: { email: "intruso.action@example.com" } });
{
  const final = await prisma.business.findUnique({ where: { id: A.id } });
  check("A's profile is restored intact", final.heroSubheadline === snapshotA.heroSubheadline && final.slug === A.slug);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
await prisma.$disconnect();
process.exit(fail ? 1 : 0);
