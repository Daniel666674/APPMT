/**
 * Tenant isolation: the public surface (booking APIs and pages).
 *
 * These are the tests that back the multi-tenancy claim: one deployment
 * serves many businesses, and no business can see or touch another's data.
 *
 * Prerequisites (see tests/README.md):
 *   1. a seeded database with at least two businesses  (npm run db:seed)
 *   2. a production build running on TEST_URL          (npm run build && npm start)
 *   3. TEST_DATABASE_URL and SESSION_SECRET matching that server's env
 *
 * Run with:  node tests/tenant-isolation.mjs
 */
import { PrismaClient } from "@prisma/client";

const BASE = process.env.TEST_URL ?? "http://localhost:3100";
const DB = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const SECRET = process.env.SESSION_SECRET;
if (!DB || !SECRET) {
  console.error("Set TEST_DATABASE_URL (or DATABASE_URL) and SESSION_SECRET to the values the server under test is using.");
  process.exit(2);
}
const prisma = new PrismaClient({ datasources: { db: { url: DB } } });

let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
}

// Start from a clean slate so the suite is repeatable: drop anything a
// previous run created.
const TEST_EMAILS = ["intruso@example.com", "cliente.real@example.com", "otro@example.com",
  "otra.ip@example.com", ...Array.from({ length: 12 }, (_, i) => `spam${i}@example.com`)];
await prisma.booking.deleteMany({ where: { customer: { email: { in: TEST_EMAILS } } } });
await prisma.customer.deleteMany({ where: { email: { in: TEST_EMAILS } } });

const [A, B] = await prisma.business.findMany({ orderBy: { createdAt: "asc" }, take: 2 });
const load = async (b) => ({
  business: b,
  service: await prisma.service.findFirst({ where: { businessId: b.id, active: true } }),
  staff: await prisma.staff.findFirst({ where: { businessId: b.id, active: true } }),
  booking: await prisma.booking.findFirst({ where: { businessId: b.id } }),
  customer: await prisma.customer.findFirst({ where: { businessId: b.id } }),
  user: await prisma.user.findFirst({ where: { isPlatformAdmin: true } }),
});
const a = await load(A), b = await load(B);
console.log(`\nA = ${A.name} (/${A.slug})\nB = ${B.name} (/${B.slug})\n`);

const date = new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10);

// The booking endpoint rate-limits per client IP. Give each run its own
// address so repeated runs aren't throttled by the previous one — and so
// the limiter itself gets exercised at the end.
const RUN_IP = `203.0.113.${Math.floor(Math.random() * 200) + 1}`;
const asClient = (ip = RUN_IP) => ({ "x-forwarded-for": ip });

console.log("── Public availability API ─────────────────────────────");
{
  const r = await fetch(`${BASE}/api/public/availability?slug=${A.slug}&serviceId=${a.service.id}&date=${date}`);
  const j = await r.json();
  check("A's own service resolves under A's slug", r.status === 200 && j.slots.length > 0, `status=${r.status}`);
}
{
  const r = await fetch(`${BASE}/api/public/availability?slug=${A.slug}&serviceId=${b.service.id}&date=${date}`);
  check("B's service is invisible under A's slug", r.status === 404, `status=${r.status}`);
}
{
  const r = await fetch(`${BASE}/api/public/availability?slug=${A.slug}&serviceId=${a.service.id}&staffId=${b.staff.id}&date=${date}`);
  check("B's staff rejected for A's service", r.status === 400, `status=${r.status}`);
}

console.log("\n── Public booking API ──────────────────────────────────");
const slotOf = async (slug, serviceId) => {
  const r = await fetch(`${BASE}/api/public/availability?slug=${slug}&serviceId=${serviceId}&date=${date}`);
  return (await r.json()).slots[0];
};
const slotA = await slotOf(A.slug, a.service.id);
const post = (body, ip) =>
  fetch(`${BASE}/api/public/bookings`, {
    method: "POST",
    headers: { "content-type": "application/json", ...asClient(ip) },
    body: JSON.stringify(body),
  });

{
  const r = await post({ slug: A.slug, serviceId: b.service.id, staffId: b.staff.id, startsAt: slotA.start,
    customerName: "Intruso", customerEmail: "intruso@example.com" });
  check("cannot book B's service through A's slug", r.status === 404, `status=${r.status}`);
}
{
  const r = await post({ slug: A.slug, serviceId: a.service.id, staffId: b.staff.id, startsAt: slotA.start,
    customerName: "Intruso", customerEmail: "intruso@example.com" });
  check("cannot book A's service with B's staff", r.status === 400, `status=${r.status}`);
}
{
  const r = await post({ slug: "no-existe-este-negocio", serviceId: a.service.id, staffId: a.staff.id,
    startsAt: slotA.start, customerName: "Intruso", customerEmail: "intruso@example.com" });
  check("unknown slug is rejected", r.status === 404, `status=${r.status}`);
}

let realBooking;
{
  const r = await post({ slug: A.slug, serviceId: a.service.id, staffId: a.staff.id, startsAt: slotA.start,
    customerName: "Cliente Real", customerEmail: "cliente.real@example.com", customerPhone: "3001234567" });
  realBooking = await r.json();
  check("a legitimate booking still succeeds", r.status === 201, `status=${r.status} ${JSON.stringify(realBooking)}`);
}
{
  const r = await post({ slug: A.slug, serviceId: a.service.id, staffId: a.staff.id, startsAt: slotA.start,
    customerName: "Otro", customerEmail: "otro@example.com" });
  check("the same slot cannot be double-booked", r.status === 409, `status=${r.status}`);
}
{
  const row = await prisma.booking.findUnique({ where: { id: realBooking.id }, include: { customer: true } });
  check("booking is stamped with A's businessId", row.businessId === A.id);
  check("customer is stamped with A's businessId", row.customer.businessId === A.id);
}

console.log("\n── Same email, two businesses ──────────────────────────");
{
  const slotB = await slotOf(B.slug, b.service.id);
  const r = await post({ slug: B.slug, serviceId: b.service.id, staffId: b.staff.id, startsAt: slotB.start,
    customerName: "Cliente Real", customerEmail: "cliente.real@example.com" });
  check("the same person can book at B too", r.status === 201, `status=${r.status}`);
  const rows = await prisma.customer.findMany({ where: { email: "cliente.real@example.com" } });
  check("that email is two separate customer records", rows.length === 2, `found ${rows.length}`);
  check("one per business", new Set(rows.map((c) => c.businessId)).size === 2);
}

console.log("\n── Abuse protection ────────────────────────────────────");
{
  // Same payload over and over from one address: the limiter must cut it off
  // well before it can grind through every open slot.
  const ip = "198.51.100.77";
  let sawLimit = false;
  for (let i = 0; i < 12; i++) {
    const r = await post({ slug: A.slug, serviceId: a.service.id, staffId: a.staff.id,
      startsAt: slotA.start, customerName: "Spam", customerEmail: `spam${i}@example.com` }, ip);
    if (r.status === 429) { sawLimit = true; break; }
  }
  check("a flood from one address gets rate-limited", sawLimit);
  const r = await post({ slug: A.slug, serviceId: a.service.id, staffId: a.staff.id,
    startsAt: slotA.start, customerName: "Otro", customerEmail: "otra.ip@example.com" }, "198.51.100.99");
  check("  …and a different address is unaffected", r.status !== 429, `status=${r.status}`);
}

console.log("\n── Public pages ────────────────────────────────────────");
for (const [name, url, want] of [
  ["A's booking page renders", `/${A.slug}`, 200],
  ["A's service page renders", `/${A.slug}/book/${a.service.id}`, 200],
  ["B's service 404s under A's slug", `/${A.slug}/book/${b.service.id}`, 404],
  ["B's booking 404s under A's confirmation", `/${A.slug}/confirmation/${b.booking.id}`, 404],
  ["unknown slug 404s", `/no-existe-este-negocio`, 404],
]) {
  const r = await fetch(`${BASE}${url}`);
  check(name, r.status === want, `status=${r.status} want=${want}`);
}

console.log("\n── Admin, signed in as A ───────────────────────────────");
// Mint the session cookie exactly the way signSessionToken() does, so this
// exercises the real proxy + requireBusinessSession path.
const { SignJWT } = await import("jose");
const secret = new TextEncoder().encode(SECRET);
const token = await new SignJWT({ userId: a.user.id, email: a.user.email, name: a.user.name, role: a.user.role, businessId: A.id })
  .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(secret);
const cookie = `appmt_session=${token}`;
const asA = (url) => fetch(`${BASE}${url}`, { headers: { cookie }, redirect: "manual" });

{
  const r = await asA("/admin");
  check("A reaches the dashboard", r.status === 200, `status=${r.status}`);
  const html = await r.text();
  check("dashboard shows A's name", html.includes(A.name));
  check("dashboard does NOT show B's name", !html.includes(B.name));
}
{
  const r = await asA("/admin/staff");
  const html = await r.text();
  check("staff list shows A's staff", html.includes(a.staff.name));
  check("staff list hides B's staff", !html.includes(b.staff.id), "B's staff id leaked into A's page");
}
{
  // A value only B can have — the shared demo placeholder would match A's own row.
  const marker = `solo-de-b-${Date.now()}@example.com`;
  const planted = await prisma.customer.create({
    data: { businessId: B.id, name: "Cliente Solo De B", email: marker },
  });
  const r = await asA("/admin/customers");
  const html = await r.text();
  check("customer list hides B's customers", !html.includes(marker), "B's customer leaked");
  check("customer list hides B's customer ids", !html.includes(planted.id), "B's customer id leaked");

  const mine = await prisma.customer.count({ where: { businessId: A.id } });
  const theirs = await prisma.customer.count({ where: { businessId: { not: A.id } } });
  check("A has fewer rows than the table holds overall", mine < mine + theirs, `mine=${mine} others=${theirs}`);
  await prisma.customer.delete({ where: { id: planted.id } });
}
{
  const r = await asA(`/admin/staff/${b.staff.id}/availability`);
  check("B's staff availability page 404s for A", r.status === 404, `status=${r.status}`);
}
{
  const r = await asA(`/admin/staff/${a.staff.id}/availability`);
  check("A's own staff availability page loads", r.status === 200, `status=${r.status}`);
}
{
  const r = await fetch(`${BASE}/admin`, { redirect: "manual" });
  check("signed-out admin redirects to login", r.status === 307 || r.status === 302, `status=${r.status}`);
}

console.log("\n── Cross-tenant totals ─────────────────────────────────");
for (const model of ["staff", "service", "customer", "booking", "timeOff"]) {
  const orphans = await prisma[model].count({ where: { businessId: null } }).catch(() => 0);
  check(`every ${model} row carries a businessId`, orphans === 0, `${orphans} orphans`);
}
{
  // Users are the one exception, and only in one direction: the platform
  // admin belongs to no business, every other login must belong to one.
  const looseOwners = await prisma.user.count({ where: { businessId: null, isPlatformAdmin: false } });
  check("every non-platform login belongs to a business", looseOwners === 0, `${looseOwners} sueltos`);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
await prisma.$disconnect();
process.exit(fail ? 1 : 0);
