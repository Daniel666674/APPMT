/**
 * The reseller console: the demo builder, the prospect CRM and tracked demo
 * links.
 *
 * Everything here belongs to whoever runs the deployment, never to a tenant,
 * so the first thing this proves is the boundary: a business owner's login is
 * refused by every one of these actions. After that it exercises the builder's
 * two dangerous behaviours — saving a whole agenda in one transaction, and
 * never deleting a service that already carries bookings.
 *
 * Prerequisites (see tests/README.md):
 *   1. a seeded database with at least two businesses  (npm run db:seed)
 *   2. a production build running on TEST_URL          (npm run build && npm start)
 *   3. TEST_DATABASE_URL and SESSION_SECRET matching that server's env
 *
 * Run with:  node tests/demo-builder.mjs
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { SignJWT } from "jose";

const BASE = process.env.TEST_URL ?? "http://localhost:3100";
const DB = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const SECRET = process.env.SESSION_SECRET;
if (!DB || !SECRET) {
  console.error(
    "Set TEST_DATABASE_URL (or DATABASE_URL) and SESSION_SECRET to the values the server under test is using."
  );
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

let pass = 0,
  fail = 0;
function check(name, ok, detail = "") {
  if (ok) {
    pass++;
    console.log(`  PASS  ${name}`);
  } else {
    fail++;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

const secret = new TextEncoder().encode(SECRET);
async function sign(user, businessId) {
  return new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    businessId,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

async function callAction(name, args, token) {
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

const [A] = await prisma.business.findMany({ orderBy: { createdAt: "asc" }, take: 1 });
const platformUser = await prisma.user.findFirst({ where: { isPlatformAdmin: true } });

// The builder rewrites an agenda wholesale, so it gets its own throwaway one
// rather than a seeded demo the other suites still depend on. It is deleted at
// the end, whatever happened in between.
await prisma.business.deleteMany({ where: { slug: "agenda-de-prueba-constructor" } });
const B = await prisma.business.create({
  data: {
    name: "Agenda de prueba",
    slug: "agenda-de-prueba-constructor",
    industryKey: "barberia",
    listed: false,
    staff: { create: { name: "Persona inicial", color: "#4f46e5", sortOrder: 0 } },
    services: {
      create: { name: "Servicio inicial", durationMinutes: 30, price: 30000, color: "#4f46e5", sortOrder: 0 },
    },
  },
});

// A business owner pinned to A: created here so the boundary is tested with a
// login that genuinely has no platform access, not with a downgraded one.
const owner = await prisma.user.upsert({
  where: { email: "duena.demo.builder@example.com" },
  update: { businessId: A.id, isPlatformAdmin: false, active: true },
  create: {
    email: "duena.demo.builder@example.com",
    name: "Dueña de prueba",
    passwordHash: "$2a$12$eImiTXuWVxfM37uY4JANjQ==invalid",
    businessId: A.id,
    role: "OWNER",
    isPlatformAdmin: false,
  },
});

const adminToken = await sign(platformUser, null);
const ownerToken = await sign(owner, A.id);

console.log(`\nAgenda bajo prueba: ${B.name} (/${B.slug})\n`);

/* ── the boundary ─────────────────────────────────────────────────── */
console.log("── El dueño de un negocio no alcanza la consola del revendedor ──");
{
  const before = await prisma.business.findUnique({ where: { id: B.id } });
  const r = await callAction("saveDemoAction", [B.id, { ...payloadFor(before), name: "Secuestrada" }], ownerToken);
  const after = await prisma.business.findUnique({ where: { id: B.id } });
  check("saveDemoAction refuses a business owner", after.name === before.name, `status=${r.status}`);
}
{
  // The same refusal on the owner's OWN agenda: what stops them is the
  // platform gate, not the tenant scoping, so this screen stays reseller-only
  // even for the one business they legitimately administer.
  const before = await prisma.business.findUnique({ where: { id: A.id } });
  await callAction("saveDemoAction", [A.id, { ...payloadFor(before), name: "Autoservicio" }], ownerToken);
  const after = await prisma.business.findUnique({ where: { id: A.id } });
  check("  …even on their own agenda", after.name === before.name);
}
{
  const before = await prisma.booking.count({ where: { businessId: B.id } });
  await callAction("seedBookingsAction", [B.id], ownerToken);
  const after = await prisma.booking.count({ where: { businessId: B.id } });
  check("seedBookingsAction refuses a business owner", after === before);
}
{
  const before = await prisma.prospect.count();
  await callAction("createProspect", [{ name: "Intruso", status: "NUEVO" }], ownerToken);
  check("createProspect refuses a business owner", (await prisma.prospect.count()) === before);
}
{
  const before = await prisma.platformSetting.count();
  await callAction("updatePlatformSettings", [{ resellerName: "Intruso" }], ownerToken);
  check("updatePlatformSettings refuses a business owner", (await prisma.platformSetting.count()) === before);
}

/* ── saving a whole agenda ────────────────────────────────────────── */
console.log("\n── El constructor guarda la agenda completa ────────────");
const snapshot = await prisma.business.findUnique({ where: { id: B.id } });
{
  const payload = payloadFor(snapshot);
  payload.name = "Demo renombrada";
  payload.primaryColor = "#123456";
  payload.services = [
    { id: "", name: "Servicio nuevo", description: "Creado por el test", durationMinutes: 45, price: 55000, color: "#123456", active: true },
  ];
  payload.staff = [{ id: "", name: "Persona nueva", bio: "", avatarUrl: "", color: "#123456", active: true }];
  payload.openDays = [2, 4];
  payload.openFromMinute = 8 * 60;
  payload.openToMinute = 17 * 60;

  const r = await callAction("saveDemoAction", [B.id, payload], adminToken);
  const after = await prisma.business.findUnique({ where: { id: B.id } });
  const services = await prisma.service.findMany({ where: { businessId: B.id, active: true } });
  const staff = await prisma.staff.findMany({ where: { businessId: B.id, active: true } });
  const availability = await prisma.availability.findMany({ where: { staff: { businessId: B.id } } });
  const links = await prisma.serviceStaff.count({ where: { service: { businessId: B.id } } });

  check("guarda el nombre y la marca", after.name === "Demo renombrada" && after.primaryColor === "#123456", `status=${r.status}`);
  check("deja exactamente los servicios enviados", services.length === 1 && services[0].name === "Servicio nuevo");
  check("deja exactamente el equipo enviado", staff.length === 1 && staff[0].name === "Persona nueva");
  check("reescribe los horarios", availability.length === 2 && availability.every((a) => a.startMinute === 480 && a.endMinute === 1020));
  check("  …en los días elegidos", availability.map((a) => a.dayOfWeek).sort().join() === "2,4");
  check("todo el equipo atiende todos los servicios", links === services.length * staff.length);
}

/* ── a service with bookings is never deleted ─────────────────────── */
console.log("\n── Un servicio con citas se desactiva, no se borra ─────");
{
  const service = await prisma.service.findFirst({ where: { businessId: B.id } });
  const staff = await prisma.staff.findFirst({ where: { businessId: B.id } });
  const customer = await prisma.customer.upsert({
    where: { businessId_email: { businessId: B.id, email: "prueba.builder@example.com" } },
    update: {},
    create: { businessId: B.id, name: "Cliente de prueba", email: "prueba.builder@example.com" },
  });
  const startsAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 30);
  const booking = await prisma.booking.create({
    data: {
      businessId: B.id,
      serviceId: service.id,
      staffId: staff.id,
      customerId: customer.id,
      startsAt,
      endsAt: new Date(startsAt.getTime() + service.durationMinutes * 60_000),
    },
  });

  // Save with an empty services list: the service is no longer wanted, but its
  // booking still points at it.
  const payload = payloadFor(await prisma.business.findUnique({ where: { id: B.id } }));
  payload.services = [];
  payload.staff = [{ id: staff.id, name: staff.name, bio: "", avatarUrl: "", color: staff.color, active: true }];
  await callAction("saveDemoAction", [B.id, payload], adminToken);

  const kept = await prisma.service.findUnique({ where: { id: service.id } });
  check("el servicio sigue existiendo", kept !== null);
  check("  …pero queda desactivado", kept?.active === false);
  check("la cita conserva su servicio", (await prisma.booking.findUnique({ where: { id: booking.id } })) !== null);

  await prisma.booking.delete({ where: { id: booking.id } });
  await prisma.customer.delete({ where: { id: customer.id } });
}

/* ── slugs ────────────────────────────────────────────────────────── */
console.log("\n── Direcciones web ────────────────────────────────────");
{
  const payload = payloadFor(await prisma.business.findUnique({ where: { id: B.id } }));
  payload.slug = A.slug;
  await callAction("saveDemoAction", [B.id, payload], adminToken);
  const after = await prisma.business.findUnique({ where: { id: B.id } });
  check("rechaza una dirección ya ocupada", after.slug !== A.slug);
}
{
  const payload = payloadFor(await prisma.business.findUnique({ where: { id: B.id } }));
  payload.slug = "admin";
  await callAction("saveDemoAction", [B.id, payload], adminToken);
  const after = await prisma.business.findUnique({ where: { id: B.id } });
  check("rechaza una dirección reservada", after.slug !== "admin");
}

/* ── tracked share links ──────────────────────────────────────────── */
console.log("\n── Enlaces con seguimiento ────────────────────────────");
{
  const current = await prisma.business.findUnique({ where: { id: B.id } });
  const share = await prisma.demoShare.create({ data: { businessId: B.id, label: "test" } });
  const viewsBefore = current.viewCount;

  const res = await fetch(`${BASE}/s/${share.token}`, { redirect: "manual" });
  const location = res.headers.get("location") ?? "";
  check("redirige a la página pública de la demo", location.endsWith(`/${current.slug}`), location);

  const opened = await prisma.demoShare.findUnique({ where: { id: share.id } });
  check("cuenta la apertura", opened.openCount === 1);
  check("  …y guarda cuándo", opened.lastOpenedAt !== null);
  check(
    "suma una visita a la agenda",
    (await prisma.business.findUnique({ where: { id: B.id } })).viewCount > viewsBefore
  );

  const unknown = await fetch(`${BASE}/s/token-que-no-existe`, { redirect: "manual" });
  check("un token desconocido no revela nada", (unknown.headers.get("location") ?? "").endsWith("/"));

  await prisma.demoShare.delete({ where: { id: share.id } });
}

/* ── the CRM ──────────────────────────────────────────────────────── */
console.log("\n── CRM de prospectos ──────────────────────────────────");
{
  await callAction(
    "createProspect",
    [{ name: "Lead de prueba", company: "Ferretería El Tornillo", status: "NUEVO", businessId: B.id, value: 90000 }],
    adminToken
  );
  const created = await prisma.prospect.findFirst({ where: { name: "Lead de prueba" } });
  check("el superadmin crea un prospecto", created !== null);
  check("  …con su demo asignada", created?.businessId === B.id);

  await callAction("setProspectStatus", [created.id, "DEMO_ENVIADA"], adminToken);
  const moved = await prisma.prospect.findUnique({ where: { id: created.id } });
  check("mover el estado también marca el último contacto", moved.status === "DEMO_ENVIADA" && moved.lastContactedAt !== null);

  await callAction("setProspectStatus", [created.id, "NO_EXISTE"], adminToken);
  check("un estado inválido se rechaza", (await prisma.prospect.findUnique({ where: { id: created.id } })).status === "DEMO_ENVIADA");

  await callAction("deleteProspect", [created.id], adminToken);
  check("borrar el prospecto no borra su demo", (await prisma.business.findUnique({ where: { id: B.id } })) !== null);
  check("  …y el prospecto sí se va", (await prisma.prospect.findUnique({ where: { id: created.id } })) === null);
}

/* ── cleanup ──────────────────────────────────────────────────────── */
{
  // Cascades take the agenda's staff, services, bookings, customers and
  // shares with it, so the database is left exactly as it was found.
  await prisma.business.delete({ where: { id: B.id } });
  await prisma.user.delete({ where: { id: owner.id } });
  check("la agenda de prueba se limpia", (await prisma.business.findUnique({ where: { id: B.id } })) === null);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
await prisma.$disconnect();
process.exit(fail === 0 ? 0 : 1);

/** The builder saves the whole agenda, so every call needs a complete payload. */
function payloadFor(b) {
  return {
    name: b.name,
    slug: b.slug,
    listed: b.listed,
    internalNotes: b.internalNotes ?? "",
    primaryColor: b.primaryColor,
    accentColor: b.accentColor,
    fontFamily: b.fontFamily,
    cornerStyle: b.cornerStyle,
    themeMode: b.themeMode === "dark" ? "dark" : "light",
    logoUrl: b.logoUrl ?? "",
    faviconUrl: b.faviconUrl ?? "",
    heroImageUrl: b.heroImageUrl ?? "",
    heroHeadline: b.heroHeadline ?? "",
    heroSubheadline: b.heroSubheadline ?? "",
    aboutText: b.aboutText ?? "",
    contactEmail: b.contactEmail ?? "",
    contactPhone: b.contactPhone ?? "",
    whatsappNumber: b.whatsappNumber ?? "",
    address: b.address ?? "",
    city: b.city ?? "",
    website: b.website ?? "",
    instagramUrl: b.instagramUrl ?? "",
    facebookUrl: b.facebookUrl ?? "",
    bookingSlotIntervalMinutes: b.bookingSlotIntervalMinutes,
    bookingBufferMinutes: b.bookingBufferMinutes,
    minNoticeMinutes: b.minNoticeMinutes,
    maxAdvanceDays: b.maxAdvanceDays,
    requirePhone: b.requirePhone,
    cancellationWindowHours: b.cancellationWindowHours,
    services: [],
    staff: [{ id: "", name: "Equipo", bio: "", avatarUrl: "", color: "#4f46e5", active: true }],
    openDays: [1, 2, 3, 4, 5],
    openFromMinute: 9 * 60,
    openToMinute: 18 * 60,
  };
}
