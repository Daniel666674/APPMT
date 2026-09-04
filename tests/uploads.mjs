/**
 * File uploads — POST /api/admin/upload.
 *
 * Uploads carry the same tenant boundary as every other write: a business
 * owner may only upload into their own agenda, a platform admin into any
 * agenda (or a draft, before one exists — only the creator wizard does that).
 *
 * This does NOT need a configured Vercel Blob store: every case here is
 * rejected before the code ever calls out to Blob, so it proves the
 * authorization layer without needing BLOB_READ_WRITE_TOKEN set. The one
 * "would succeed" case is asserted by its error message, which only appears
 * once auth has already passed — it fails on the *next* step (talking to
 * Blob), not on authorization.
 *
 * Prerequisites (see tests/README.md):
 *   1. a seeded database with at least two businesses  (npm run db:seed)
 *   2. a production build running on TEST_URL          (npm run build && npm start)
 *   3. TEST_DATABASE_URL and SESSION_SECRET matching that server's env
 *
 * Run with:  node tests/uploads.mjs
 */
import { PrismaClient } from "@prisma/client";
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
  return new SignJWT({ userId: user.id, email: user.email, name: user.name, role: user.role, businessId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(secret);
}

function tinyPng() {
  // The smallest valid PNG: a 1x1 transparent pixel.
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
  return new Blob([Buffer.from(base64, "base64")], { type: "image/png" });
}

async function upload(token, { file, businessId } = {}) {
  const body = new FormData();
  if (file !== null) body.set("file", file ?? tinyPng(), "logo.png");
  if (businessId !== undefined) body.set("businessId", businessId);
  const res = await fetch(`${BASE}/api/admin/upload`, {
    method: "POST",
    headers: { cookie: `appmt_session=${token}` },
    body,
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const [A, B] = await prisma.business.findMany({ orderBy: { createdAt: "asc" }, take: 2 });
const platformUser = await prisma.user.findFirst({ where: { isPlatformAdmin: true } });

const owner = await prisma.user.upsert({
  where: { email: "duena.uploads@example.com" },
  update: { businessId: A.id, isPlatformAdmin: false, active: true },
  create: {
    email: "duena.uploads@example.com",
    name: "Dueña de prueba",
    passwordHash: "$2a$12$eImiTXuWVxfM37uY4JANjQ==invalid",
    businessId: A.id,
    role: "OWNER",
    isPlatformAdmin: false,
  },
});

const adminToken = await sign(platformUser, null);
const ownerToken = await sign(owner, A.id);

console.log(`\nA = ${A.name} (dueña de prueba pertenece aquí)\nB = ${B.name}\n`);

console.log("── Sin sesión ───────────────────────────────────────");
{
  // requireSession() redirects unauthenticated requests to /admin/login —
  // the same behaviour every other admin route has — so the thing to prove
  // here is that it never reaches the upload code, not a particular status.
  const res = await fetch(`${BASE}/api/admin/upload`, { method: "POST", body: new FormData(), redirect: "manual" });
  const location = res.headers.get("location") ?? "";
  check("una petición sin cookie se redirige al login, no sube nada", location.includes("/admin/login"), `status=${res.status} location=${location}`);
}

console.log("\n── Límites de la dueña de un negocio ─────────────────");
{
  const r = await upload(ownerToken, { businessId: A.id });
  check(
    "puede subir a su propia agenda (pasa la autorización)",
    r.status !== 403,
    `status=${r.status} body=${JSON.stringify(r.json)}`
  );
}
{
  const r = await upload(ownerToken, { businessId: B.id });
  check("no puede subir a la agenda de otro negocio", r.status === 403, `status=${r.status}`);
}
{
  const r = await upload(ownerToken, { businessId: undefined });
  check("no puede subir en modo borrador (sin agenda)", r.status === 403, `status=${r.status}`);
}

console.log("\n── El superadministrador ──────────────────────────────");
{
  const r = await upload(adminToken, { businessId: B.id });
  check(
    "puede subir a cualquier agenda",
    r.status !== 403,
    `status=${r.status} body=${JSON.stringify(r.json)}`
  );
}
{
  const r = await upload(adminToken, { businessId: undefined });
  check(
    "puede subir en modo borrador, para el asistente de creación",
    r.status !== 403,
    `status=${r.status} body=${JSON.stringify(r.json)}`
  );
}
{
  const r = await upload(adminToken, { businessId: "no-existe-esta-agenda" });
  check("una agenda inexistente se rechaza", r.status === 404, `status=${r.status}`);
}

console.log("\n── Validación del archivo ──────────────────────────────");
{
  const bad = new Blob(["esto no es una imagen"], { type: "text/plain" });
  const r = await upload(adminToken, { file: bad, businessId: A.id });
  check("un archivo que no es imagen se rechaza", r.status === 422, `status=${r.status} body=${JSON.stringify(r.json)}`);
}
{
  const r = await upload(adminToken, { file: null, businessId: A.id });
  check("una petición sin archivo se rechaza", r.status === 400, `status=${r.status}`);
}

await prisma.user.delete({ where: { id: owner.id } });

console.log(`\n${pass} passed, ${fail} failed\n`);
await prisma.$disconnect();
process.exit(fail === 0 ? 0 : 1);
