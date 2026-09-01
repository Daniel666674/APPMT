/**
 * Platform access is the sharpest privilege on the deployment: it reaches
 * every business. These tests check that it is a real boundary — that a
 * client's own login cannot list, enter, create or delete another agenda,
 * and cannot get there by forging a session cookie either.
 *
 * Prerequisites: see tests/README.md.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { SignJWT } from "jose";

const BASE = process.env.TEST_URL ?? "http://localhost:3100";
const DB = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const SECRET = process.env.SESSION_SECRET;
const SETUP_SECRET = process.env.SETUP_SECRET ?? "";
if (!DB || !SECRET) {
  console.error("Set TEST_DATABASE_URL (or DATABASE_URL) and SESSION_SECRET.");
  process.exit(2);
}
const prisma = new PrismaClient({ datasources: { db: { url: DB } } });

let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
}

const manifest = JSON.parse(readFileSync(".next/server/server-reference-manifest.json", "utf8")).node;
const actions = {};
for (const [id, v] of Object.entries(manifest)) actions[v.exportedName] = { id, page: Object.keys(v.workers)[0] };
const pageUrl = (p) =>
  BASE + "/" + p.replace(/^app/, "").replace(/\/page$/, "").replace(/\(\w+\)\//g, "").replace(/^\//, "");

const key = new TextEncoder().encode(SECRET);
const mint = (user, businessId, claims = {}) =>
  new SignJWT({ userId: user.id, email: user.email, name: user.name, role: user.role, businessId, ...claims })
    .setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(key);

const admin = await prisma.user.findFirst({ where: { isPlatformAdmin: true } });
const [demoA, demoB] = await prisma.business.findMany({ orderBy: { createdAt: "asc" }, take: 2 });

// A client login scoped to its own agenda, standing in for a business you sold to.
const clientBiz = await prisma.business.findFirst({ where: { slug: "cliente-de-prueba" } })
  ?? (await prisma.business.create({
    data: { name: "Cliente De Prueba", slug: "cliente-de-prueba", listed: false },
  }));
const bcrypt = (await import("bcryptjs")).default;
const client = await prisma.user.upsert({
  where: { email: "cliente.prueba@example.com" },
  update: { businessId: clientBiz.id, isPlatformAdmin: false, active: true },
  create: {
    businessId: clientBiz.id, email: "cliente.prueba@example.com",
    passwordHash: await bcrypt.hash("contrasena123", 10), name: "Cliente", role: "OWNER",
  },
});

const adminCookie = `appmt_session=${await mint(admin, admin.businessId, { isPlatformAdmin: true })}`;
const clientCookie = `appmt_session=${await mint(client, client.businessId, { isPlatformAdmin: false })}`;
// The dangerous one: a client cookie that simply *claims* platform access.
const forgedCookie = `appmt_session=${await mint(client, client.businessId, { isPlatformAdmin: true })}`;
// And one that claims to already be standing inside someone else's agenda.
const forgedBizCookie = `appmt_session=${await mint(client, demoA.id, { isPlatformAdmin: true })}`;

const get = (url, cookie) => fetch(`${BASE}${url}`, { headers: { cookie }, redirect: "manual" });
const callAction = (name, args, cookie) => {
  const { id, page } = actions[name];
  return fetch(pageUrl(page), {
    method: "POST",
    headers: { cookie, "Next-Action": id, "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify(args),
    redirect: "manual",
  });
};

console.log(`\nplatform admin: ${admin.email}\nclient login:   ${client.email} (/${clientBiz.slug})\n`);

console.log("── The console itself ──────────────────────────────────");
{
  const r = await get("/admin/negocios", adminCookie);
  const html = await r.text();
  check("platform admin reaches the console", r.status === 200, `status=${r.status}`);
  check("  …and sees other agendas listed", html.includes(demoB.name));
}
{
  const r = await get("/admin/negocios", clientCookie);
  check("a client login is redirected away", r.status === 307 || r.status === 302, `status=${r.status}`);
  check("  …and gets no agenda list", !(await r.text()).includes(demoB.name));
}
{
  const r = await get("/admin/negocios/nueva", clientCookie);
  check("a client login cannot open the creator", r.status === 307 || r.status === 302, `status=${r.status}`);
}
{
  const r = await get("/admin/negocios", forgedCookie);
  check("a forged isPlatformAdmin claim is refused", r.status === 307 || r.status === 302, `status=${r.status}`);
  check("  …and leaks no agenda names", !(await r.text()).includes(demoB.name));
}

console.log("\n── Standing inside someone else's agenda ───────────────");
{
  const r = await get("/admin", forgedBizCookie);
  const html = await r.text();
  check("a forged businessId does not open another agenda", !html.includes(demoA.name), `status=${r.status}`);
}
{
  const r = await get("/admin", clientCookie);
  const html = await r.text();
  check("a client login lands in its own agenda", r.status === 200 && html.includes(clientBiz.name), `status=${r.status}`);
}

console.log("\n── Cross-agenda actions ────────────────────────────────");
{
  const before = await prisma.business.count();
  await callAction("deleteBusiness", [demoB.id], clientCookie);
  check("a client cannot delete another agenda", (await prisma.business.count()) === before);
}
{
  const before = await prisma.business.count();
  await callAction("deleteBusiness", [demoB.id], forgedCookie);
  check("  …not even with a forged platform claim", (await prisma.business.count()) === before);
}
{
  const before = await prisma.business.findUnique({ where: { id: demoB.id }, select: { listed: true } });
  await callAction("toggleBusinessListed", [demoB.id, !before.listed], clientCookie);
  const after = await prisma.business.findUnique({ where: { id: demoB.id }, select: { listed: true } });
  check("a client cannot hide another agenda", after.listed === before.listed);
}
{
  // switchBusiness is the one action that rewrites a session's businessId.
  const r = await callAction("switchBusiness", [demoA.id], clientCookie);
  const setCookie = r.headers.get("set-cookie") ?? "";
  check("a client cannot switch into another agenda", !setCookie.includes("appmt_session="), `set-cookie=${setCookie.slice(0, 40)}`);
}

console.log("\n── Creating agendas ────────────────────────────────────");
const createBody = (slug) => ({
  agenda: {
    industryKey: "barberia", businessName: `Prueba ${slug}`, slug,
    primaryColor: "#111111", accentColor: "#222222", fontFamily: "inter",
    cornerStyle: "soft", themeMode: "light",
    openDays: [1, 2, 3], openFromMinute: 540, openToMinute: 1080,
    listed: false, createOwnerUser: false,
  },
});
{
  const before = await prisma.business.count();
  const r = await fetch(`${BASE}/api/agendas`, {
    method: "POST", headers: { "content-type": "application/json", cookie: clientCookie },
    body: JSON.stringify(createBody("prueba-cliente")),
  });
  check("a client login cannot create an agenda", r.status === 401, `status=${r.status}`);
  check("  …and none was created", (await prisma.business.count()) === before);
}
{
  const r = await fetch(`${BASE}/api/agendas`, {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ ...createBody("prueba-anon"), secret: "clave-equivocada" }),
  });
  check("a wrong setup secret is refused", r.status === 401, `status=${r.status}`);
}
{
  const r = await fetch(`${BASE}/api/agendas`, {
    method: "POST", headers: { "content-type": "application/json", cookie: adminCookie },
    body: JSON.stringify(createBody("prueba-admin")),
  });
  const body = await r.json();
  check("the platform admin can create one", r.status === 201, `status=${r.status} ${JSON.stringify(body)}`);
  if (r.status === 201) {
    const made = await prisma.business.findUnique({
      where: { id: body.businessId },
      include: { _count: { select: { users: true, services: true, staff: true } } },
    });
    check("  …with the demo carrying no login of its own", made._count.users === 0);
    check("  …and its services and team ready to edit", made._count.services > 0 && made._count.staff > 0);
    check("  …on the slug that was asked for", made.slug === "prueba-admin");
    check("  …in COP", made.currency === "COP");
    const page = await fetch(`${BASE}/prueba-admin`);
    check("  …and its URL serves immediately", page.status === 200, `status=${page.status}`);
    await prisma.business.delete({ where: { id: made.id } });
  }
}
{
  const r = await fetch(`${BASE}/api/agendas`, {
    method: "POST", headers: { "content-type": "application/json", cookie: adminCookie },
    body: JSON.stringify(createBody(demoA.slug)),
  });
  check("a slug already taken is refused", r.status === 409, `status=${r.status}`);
}
{
  const r = await fetch(`${BASE}/api/agendas`, {
    method: "POST", headers: { "content-type": "application/json", cookie: adminCookie },
    body: JSON.stringify(createBody("admin")),
  });
  check("a reserved slug is refused", r.status === 409, `status=${r.status}`);
}

console.log("\n── The slug checker ────────────────────────────────────");
{
  const r = await fetch(`${BASE}/api/agenda-slug?value=algo-nuevo`);
  check("is closed to anonymous callers", r.status === 401, `status=${r.status}`);
}
{
  const r = await fetch(`${BASE}/api/agenda-slug?value=${demoA.slug}`, { headers: { cookie: adminCookie } });
  const body = await r.json();
  check("reports a taken slug as taken", body.available === false, JSON.stringify(body));
}
if (SETUP_SECRET) {
  const r = await fetch(`${BASE}/api/agenda-slug?value=algo-muy-nuevo&secret=${SETUP_SECRET}`);
  check("answers the setup page with its secret", r.status === 200, `status=${r.status}`);
}

console.log("\n── Platform admin really can edit every agenda ─────────");
{
  const r = await callAction("switchBusiness", [demoB.id], adminCookie);
  const setCookie = r.headers.get("set-cookie") ?? "";
  check("switching into another agenda issues a new session", setCookie.includes("appmt_session="));
  const newCookie = setCookie.split(";")[0];
  const dash = await get("/admin", newCookie);
  const html = await dash.text();
  check("  …and the dashboard is now that agenda", html.includes(demoB.name), `status=${dash.status}`);
  const services = await get("/admin/services", newCookie);
  const svcHtml = await services.text();
  const first = await prisma.service.findFirst({ where: { businessId: demoB.id } });
  check("  …with its services editable", svcHtml.includes(first.name));
}

await prisma.user.delete({ where: { id: client.id } }).catch(() => {});
await prisma.business.delete({ where: { id: clientBiz.id } }).catch(() => {});

console.log(`\n${pass} passed, ${fail} failed\n`);
await prisma.$disconnect();
process.exit(fail ? 1 : 0);
