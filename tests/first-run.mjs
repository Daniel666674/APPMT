/**
 * First run on an empty deployment, under the current model.
 *
 * The superadmin belongs to no business: /setup asks only for an email, a
 * password and the setup key, and never for a sector or a brand. Agendas
 * come afterwards and carry no login of their own unless one is asked for.
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

if ((await prisma.user.count()) > 0 || (await prisma.business.count()) > 0) {
  console.error("This suite needs an empty database.");
  process.exit(2);
}

const setup = (body) =>
  fetch(`${BASE}/api/setup`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `198.51.100.${Math.floor(Math.random()*200)+1}` },
    body: JSON.stringify(body),
  });

console.log("\n── /setup asks for nothing but an account ──────────────");
{
  const r = await fetch(`${BASE}/setup`);
  const html = await r.text();
  check("the page loads", r.status === 200, `status=${r.status}`);
  check("  …and never asks for a sector or a brand", !/Sector del negocio|Identidad de marca/.test(html));
}
{
  const r = await setup({ secret: "mala", email: "x@y.com", password: "unaclave12345" });
  check("a wrong key is refused", r.status === 401, `status=${r.status}`);
  check("  …and creates nothing", (await prisma.user.count()) === 0);
}
{
  const r = await setup({ secret: SECRET, email: "no-es-correo", password: "unaclave12345" });
  check("an invalid email is refused", r.status === 400, `status=${r.status}`);
}
{
  const r = await setup({ secret: SECRET, email: "daniel@blackscale.co", password: "corta" });
  check("a short password is refused", r.status === 400, `status=${r.status}`);
}

console.log("\n── The superadmin ──────────────────────────────────────");
{
  const r = await setup({ secret: SECRET, email: "daniel@blackscale.co", password: "MiClave2026" });
  check("the account is created", r.status === 201, `status=${r.status}`);
  const user = await prisma.user.findUnique({ where: { email: "daniel@blackscale.co" } });
  check("  …it runs the platform", user?.isPlatformAdmin === true);
  check("  …and belongs to NO business", user?.businessId === null);
  check("  …with a working password", await bcrypt.compare("MiClave2026", user.passwordHash));
  check("  …and no agenda was invented for it", (await prisma.business.count()) === 0);
}
{
  const r = await setup({ secret: SECRET, email: "otro@blackscale.co", password: "OtraClave2026" });
  check("a second account is refused", r.status === 409, `status=${r.status}`);
  check("  …so there is exactly one", (await prisma.user.count()) === 1);
}
{
  const r = await fetch(`${BASE}/setup`, { redirect: "manual" });
  check("/setup steps aside once an account exists", r.status === 307 || r.status === 302, `status=${r.status}`);
}

console.log(`\n${pass} passed, ${fail} failed\n`);
await prisma.$disconnect();
process.exit(fail ? 1 : 0);
