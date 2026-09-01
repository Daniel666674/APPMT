/**
 * The signed-in person's own account: /admin/cuenta.
 *
 * For a platform admin this is the single login behind every agenda, so
 * changing its password is the most consequential thing in the product. These
 * tests check the guards hold and that a real change actually takes effect.
 *
 * Prerequisites: see tests/README.md.
 */
import { PrismaClient } from "@prisma/client";
import { readFileSync } from "node:fs";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";

const BASE = process.env.TEST_URL ?? "http://localhost:3100";
const DB = process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;
const SECRET = process.env.SESSION_SECRET;
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
const admin = await prisma.user.findFirst({ where: { isPlatformAdmin: true } });
const restore = { name: admin.name, email: admin.email, passwordHash: admin.passwordHash };
await prisma.user.update({ where: { id: admin.id }, data: { passwordHash: await bcrypt.hash("changeme123", 10) } });

const cookie = `appmt_session=${await new SignJWT({
  userId: admin.id, email: admin.email, name: admin.name, role: admin.role,
  businessId: admin.businessId, isPlatformAdmin: true,
}).setProtectedHeader({ alg: "HS256" }).setIssuedAt().setExpirationTime("7d").sign(key)}`;

const call = (name, args) =>
  fetch(pageUrl(actions[name].page), {
    method: "POST",
    headers: { cookie, "Next-Action": actions[name].id, "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify(args),
    redirect: "manual",
  });
const hashOf = async () => (await prisma.user.findUnique({ where: { id: admin.id } })).passwordHash;

console.log("\n── The page ────────────────────────────────────────────");
{
  const r = await fetch(`${BASE}/admin/cuenta`, { headers: { cookie }, redirect: "manual" });
  const html = await r.text();
  check("loads for a signed-in user", r.status === 200, `status=${r.status}`);
  check("  …marked as the main account", html.includes("Cuenta principal"));
  check("  …saying how many agendas it runs", /entras a las \d+ agendas/.test(html));
}
{
  const r = await fetch(`${BASE}/admin/cuenta`, { redirect: "manual" });
  check("signed-out is sent to login", r.status === 307 || r.status === 302, `status=${r.status}`);
}

console.log("\n── Changing the password ───────────────────────────────");
{
  await call("updateAccountPassword", [{ currentPassword: "equivocada", newPassword: "nuevaclave123", confirmPassword: "nuevaclave123" }]);
  check("a wrong current password changes nothing", await bcrypt.compare("changeme123", await hashOf()));
}
{
  await call("updateAccountPassword", [{ currentPassword: "changeme123", newPassword: "corta", confirmPassword: "corta" }]);
  check("a too-short new password is refused", await bcrypt.compare("changeme123", await hashOf()));
}
{
  await call("updateAccountPassword", [{ currentPassword: "changeme123", newPassword: "nuevaclave123", confirmPassword: "otradistinta" }]);
  check("a mismatched confirmation is refused", await bcrypt.compare("changeme123", await hashOf()));
}
{
  await call("updateAccountPassword", [{ currentPassword: "changeme123", newPassword: "nuevaclave123", confirmPassword: "nuevaclave123" }]);
  check("the right current password does change it", await bcrypt.compare("nuevaclave123", await hashOf()));
}
// login is a useActionState form action and isn't callable the way the
// other actions are, so rather than fake its wire format this asserts the
// exact check login performs: verifyPassword() against the stored hash.
{
  const hash = await hashOf();
  check("  …so the new password now authenticates", await bcrypt.compare("nuevaclave123", hash));
  check("  …and the old one no longer does", !(await bcrypt.compare("changeme123", hash)));
}

console.log("\n── Changing name and email ─────────────────────────────");
{
  const r = await call("updateAccountProfile", [{ name: "Daniel", email: "daniel.nuevo@example.com" }]);
  const u = await prisma.user.findUnique({ where: { id: admin.id } });
  check("name and email are saved", u.name === "Daniel" && u.email === "daniel.nuevo@example.com", `${u.name}/${u.email}`);
  check("  …and the session is re-issued, not left stale", (r.headers.get("set-cookie") ?? "").includes("appmt_session="));
}
{
  const other = await prisma.user.create({
    data: { businessId: admin.businessId, email: "ocupado@example.com", passwordHash: "x", name: "Otro", role: "OWNER" },
  });
  await call("updateAccountProfile", [{ name: "Daniel", email: "ocupado@example.com" }]);
  const u = await prisma.user.findUnique({ where: { id: admin.id } });
  check("an email already in use is refused", u.email === "daniel.nuevo@example.com", u.email);
  await prisma.user.delete({ where: { id: other.id } });
}
{
  await call("updateAccountProfile", [{ name: "D", email: "daniel.nuevo@example.com" }]);
  const u = await prisma.user.findUnique({ where: { id: admin.id } });
  check("a one-letter name is refused", u.name === "Daniel", u.name);
}
{
  const before = await prisma.user.findUnique({ where: { id: admin.id }, select: { isPlatformAdmin: true, businessId: true } });
  check("platform access survives an account edit", before.isPlatformAdmin === true);
  check("  …and the account stays on its business", before.businessId === admin.businessId);
}

// Leave the account exactly as it was found.
await prisma.user.update({ where: { id: admin.id }, data: restore });
console.log(`\n${pass} passed, ${fail} failed\n`);
await prisma.$disconnect();
process.exit(fail ? 1 : 0);
