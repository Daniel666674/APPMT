/**
 * Account recovery at /recuperar.
 *
 * This is the one route that can set a password without knowing the old one,
 * so the gate has to hold: without SETUP_SECRET it must reveal nothing and
 * change nothing. It also has to actually work, because the alternative is
 * the owner writing SQL against production.
 *
 * Prerequisites: see tests/README.md. Also needs SETUP_SECRET to match the
 * server under test.
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

const post = (payload) =>
  fetch(`${BASE}/api/recuperar`, {
    method: "POST",
    headers: { "content-type": "application/json", "x-forwarded-for": `198.51.100.${Math.floor(Math.random() * 200) + 1}` },
    body: JSON.stringify(payload),
  });

const admin = await prisma.user.findFirst({ where: { isPlatformAdmin: true } });
const restore = { passwordHash: admin.passwordHash, isPlatformAdmin: admin.isPlatformAdmin };
const hashOf = async () => (await prisma.user.findUnique({ where: { id: admin.id } })).passwordHash;

console.log(`\nrecovering: ${admin.email}\n`);

console.log("── The gate ────────────────────────────────────────────");
{
  const r = await post({ action: "list", secret: "clave-equivocada" });
  const body = await r.json();
  check("a wrong secret is refused", r.status === 401, `status=${r.status}`);
  check("  …and no accounts are revealed", body.accounts === undefined);
}
{
  const r = await post({ action: "list" });
  check("no secret at all is refused", r.status === 401, `status=${r.status}`);
}
{
  const before = await hashOf();
  const r = await post({ action: "reset", secret: "clave-equivocada", email: admin.email, password: "intruso12345" });
  check("a reset without the secret is refused", r.status === 401, `status=${r.status}`);
  check("  …and the password is untouched", (await hashOf()) === before);
}
{
  const r = await fetch(`${BASE}/recuperar`);
  const html = await r.text();
  check("the page itself loads", r.status === 200, `status=${r.status}`);
  check("  …without leaking any account before the secret", !html.includes(admin.email));
}

console.log("── Listing accounts ────────────────────────────────────");
{
  const r = await post({ action: "list", secret: SECRET });
  const body = await r.json();
  check("the right secret lists the accounts", r.status === 200, `status=${r.status}`);
  const mine = body.accounts?.find((a) => a.email === admin.email);
  check("  …including the main one, marked as such", Boolean(mine?.isPlatformAdmin));
  check("  …and never any password hash", !JSON.stringify(body).includes("$2"));
}

console.log("── Resetting ───────────────────────────────────────────");
{
  const before = await hashOf();
  const r = await post({ action: "reset", secret: SECRET, email: admin.email, password: "corta" });
  check("a too-short password is refused", r.status === 400, `status=${r.status}`);
  check("  …and nothing changed", (await hashOf()) === before);
}
{
  const r = await post({ action: "reset", secret: SECRET, email: "no.existe@example.com", password: "unaclave12345" });
  check("an unknown account is refused", r.status === 404, `status=${r.status}`);
}
{
  const r = await post({ action: "reset", secret: SECRET, email: admin.email, password: "MiClaveNueva123" });
  check("a real reset succeeds", r.status === 200, `status=${r.status}`);
  const hash = await hashOf();
  check("  …the new password authenticates", await bcrypt.compare("MiClaveNueva123", hash));
  check("  …and platform access is intact", (await prisma.user.findUnique({ where: { id: admin.id } })).isPlatformAdmin);
}
{
  // The email is matched case-insensitively, the way people actually type it.
  const r = await post({ action: "reset", secret: SECRET, email: admin.email.toUpperCase(), password: "OtraClave12345" });
  check("the email is matched however it is typed", r.status === 200, `status=${r.status}`);
  check("  …and that password authenticates too", await bcrypt.compare("OtraClave12345", await hashOf()));
}

console.log("── Nobody left with platform access ────────────────────");
{
  await prisma.user.updateMany({ data: { isPlatformAdmin: false } });
  const r = await post({ action: "reset", secret: SECRET, email: admin.email, password: "RescateTotal123" });
  const body = await r.json();
  check("recovery restores platform access when none is left", body.promoted === true, JSON.stringify(body));
  const after = await prisma.user.findUnique({ where: { id: admin.id } });
  check("  …so the console is reachable again", after.isPlatformAdmin === true);
}
{
  // With an admin already in place it must not hand out access to just anyone.
  const other = await prisma.user.create({
    data: {
      businessId: admin.businessId,
      email: "cliente.recuperar@example.com",
      passwordHash: await bcrypt.hash("loquesea123", 10),
      name: "Cliente",
      role: "OWNER",
    },
  });
  const r = await post({ action: "reset", secret: SECRET, email: other.email, password: "SuClaveNueva123" });
  const body = await r.json();
  check("recovering a client does not promote it", body.promoted === false);
  const after = await prisma.user.findUnique({ where: { id: other.id } });
  check("  …it stays a plain account", after.isPlatformAdmin === false);
  check("  …but its password did change", await bcrypt.compare("SuClaveNueva123", after.passwordHash));
  await prisma.user.delete({ where: { id: other.id } });
}

console.log("── Abuse protection ────────────────────────────────────");
{
  const ip = "203.0.113.55";
  let limited = false;
  for (let i = 0; i < 14; i++) {
    const r = await fetch(`${BASE}/api/recuperar`, {
      method: "POST",
      headers: { "content-type": "application/json", "x-forwarded-for": ip },
      body: JSON.stringify({ action: "list", secret: `intento-${i}` }),
    });
    if (r.status === 429) { limited = true; break; }
  }
  check("guessing the secret gets rate-limited", limited);
}

await prisma.user.update({ where: { id: admin.id }, data: restore });
console.log(`\n${pass} passed, ${fail} failed\n`);
await prisma.$disconnect();
process.exit(fail ? 1 : 0);
