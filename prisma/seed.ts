import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { INDUSTRIES } from "../src/lib/industries";
import { ProvisionError, provisionBusiness } from "../src/lib/provision";

const prisma = new PrismaClient();

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? "owner@example.com";
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "changeme123";

/**
 * Fills a local database the way a real deployment ends up: one superadmin
 * account that belongs to no business, and one demo agenda per sector, none
 * of which carries a login of its own.
 *
 * That is the whole model in one script — the superadmin reaches every
 * agenda, and a prospect just opens a demo's URL.
 *
 * Re-running is safe: it only creates what is missing.
 */
async function main() {
  let admin = await prisma.user.findFirst({ where: { isPlatformAdmin: true } });
  if (!admin) {
    admin = await prisma.user.create({
      data: {
        email: OWNER_EMAIL,
        passwordHash: await bcrypt.hash(OWNER_PASSWORD, 12),
        name: "Administrador",
        role: "OWNER",
        isPlatformAdmin: true,
        businessId: null,
      },
    });
  }

  const existing = await prisma.business.findMany({ select: { name: true } });
  const taken = new Set(existing.map((b) => b.name.trim().toLowerCase()));

  const created: string[] = [];
  for (const industry of INDUSTRIES) {
    if (taken.has(industry.defaultBusinessName.trim().toLowerCase())) continue;
    try {
      const result = await provisionBusiness(prisma, {
        industryKey: industry.key,
        createOwnerUser: false,
      });
      created.push(`/${result.slug}`);
    } catch (err) {
      if (err instanceof ProvisionError) continue;
      throw err;
    }
  }

  console.log(`\nSeed complete. ${created.length} agenda(s) created.\n`);
  for (const slug of created) console.log(`  ${slug}`);
  console.log(`\nOne login runs all of them: ${admin.email} / ${OWNER_PASSWORD}`);
  console.log("Sign in at /admin/login. Change this password before production.\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
