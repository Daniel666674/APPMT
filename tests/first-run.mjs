/**
 * First run on an empty deployment.
 *
 * The trap this guards against: creating the first agenda as a "demo" with
 * no login, which leaves the deployment with zero accounts. Nobody could
 * sign in, and /recuperar would only point back at /setup — a loop with no
 * way out except SQL. So the first agenda must carry the superadmin.
 *
 * Needs its own empty database. Prerequisites: see tests/README.md.
 */
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const BASE = process.env.TEST_URL ?? "http://localhost:3100";
const DB = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const SECRET = process.env.SETUP_SECRET;
if (!DB || !SECRET) {
  console.error("Set TEST_DATABASE_URL (or DATABASE_URL) and SETUP_SECRET.");
  process.exit(2);
}
const prisma = new PrismaClient({ datasources: { db: { url: DB } } });

let pass = 0, fail = 0;
function check(name, ok, detail = "") {
  if (ok) { pass++; console.log(`  PASS  ${name}`); }
  else { fail++; console.log(`  FAIL  ${name} ${detail}`); }
}

const users = await prisma.user.count();
const businesses = await prisma.business.count();
if (users > 0 || businesses > 0) {
  console.error(`This suite needs an empty database (found ${users} users, ${businesses} businesses).`);
  process.exit(2);
}

const agenda = (over = {}) => ({
  industryKey: "barberia",
  businessName: "Barbería Primera",
  slug: "barberia-primera",
  primaryColor: "#1f2937",
  accentColor: "#d97706",
  fontFamily: "inter",
  cornerStyle: "soft",
  themeMode: "light",
  openDays: [1, 2, 3, 4, 5],
  openFromMinute: 540,
  openToMinute: 1080,
  listed: true,
  createOwnerUser: false,
  ...over,
});
const create = (over) =>
  fetch(`${BASE}/api/agendas`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret: SECRET, agenda: agenda(over) }),
  });

console.log("\n── An empty deployment ─────────────────────────────────");
{
  const r = await fetch(`${BASE}/setup`);
  const html = await r.text();
  check("/setup frames itself as first run", html.includes("Pon en marcha tu herramienta"), `status=${r.status}`);
  check("  …and says this creates your account", html.includes("tu cuenta de administrador"));
}
{
  const r = await fetch(`${BASE}/`);
  const html = await r.text();
  check("the library says there is nothing yet", html.includes("Todavía no hay agendas"), `status=${r.status}`);
}

console.log("\n── The trap: a first agenda with no login ──────────────");
{
  const r = await create({ createOwnerUser: false });
  const body = await r.json();
  check("creating one without an account is refused", r.status === 409, `status=${r.status}`);
  check("  …and says why", /cuenta de administrador/i.test(body.error ?? ""), body.error);
  check("  …and no business was created", (await prisma.business.count()) === 0);
  check("  …leaving nobody locked out", (await prisma.user.count()) === 0);
}
{
  // Same refusal when the flag is simply absent rather than false.
  const a = agenda();
  delete a.createOwnerUser;
  const r = await fetch(`${BASE}/api/agendas`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ secret: SECRET, agenda: a }),
  });
  check("omitting the flag is refused too", r.status === 409, `status=${r.status}`);
}

console.log("\n── Creating it properly ────────────────────────────────");
{
  const r = await create({
    createOwnerUser: true,
    ownerEmail: "daniel@blackscale.co",
    ownerPassword: "MiClaveSegura123",
  });
  const body = await r.json();
  check("with an account it succeeds", r.status === 201, `status=${r.status} ${JSON.stringify(body)}`);

  const user = await prisma.user.findUnique({ where: { email: "daniel@blackscale.co" } });
  check("  …the account exists", Boolean(user));
  check("  …it is the superadmin", user?.isPlatformAdmin === true);
  check("  …the password works", await bcrypt.compare("MiClaveSegura123", user.passwordHash));

  const page = await fetch(`${BASE}/barberia-primera`);
  check("  …and the agenda is live on its URL", page.status === 200, `status=${page.status}`);
}

console.log("\n── After that, demos need no login ─────────────────────");
{
  const r = await create({
    businessName: "Spa Segunda",
    slug: "spa-segunda",
    industryKey: "spa",
    createOwnerUser: false,
  });
  const body = await r.json();
  check("a second agenda without a login is allowed", r.status === 201, `status=${r.status} ${JSON.stringify(body)}`);

  const made = await prisma.business.findUnique({
    where: { id: body.businessId },
    include: { _count: { select: { users: true, services: true, staff: true } } },
  });
  check("  …it carries no user of its own", made._count.users === 0);
  check("  …but has services and a team to edit", made._count.services > 0 && made._count.staff > 0);

  const page = await fetch(`${BASE}/spa-segunda`);
  check("  …and a lead can just open its URL", page.status === 200, `status=${page.status}`);

  check("  …with still exactly one account on the deployment", (await prisma.user.count()) === 1);
}
{
  const r = await fetch(`${BASE}/`);
  const html = await r.text();
  check("both agendas show in the library", html.includes("Barbería Primera") && html.includes("Spa Segunda"));
}

console.log(`\n${pass} passed, ${fail} failed\n`);
await prisma.$disconnect();
process.exit(fail ? 1 : 0);
