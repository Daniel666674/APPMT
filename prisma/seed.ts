import { PrismaClient } from "@prisma/client";
import { INDUSTRIES } from "../src/lib/industries";
import { ProvisionError, provisionBusiness } from "../src/lib/provision";

const prisma = new PrismaClient();

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? "owner@example.com";
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "changeme123";

/**
 * Seeds one demo agenda per industry, each on its own URL, plus the single
 * platform-admin account that runs all of them.
 *
 * The demos deliberately carry no login of their own. One account reaches
 * every agenda from /admin/negocios, so there is one email and one password
 * to remember no matter how many demos exist — and each demo's services,
 * prices, staff and hours stay fully editable from that account.
 *
 * Re-running is safe: it only creates agendas whose slug is still free.
 */
async function main() {
  const created: { name: string; slug: string }[] = [];
  let skipped = 0;

  for (const [index, industry] of INDUSTRIES.entries()) {
    const exists = await prisma.business.findFirst({
      where: { name: industry.defaultBusinessName },
      select: { id: true },
    });
    if (exists) {
      skipped += 1;
      continue;
    }

    try {
      // The first agenda carries the platform account; the rest carry none.
      const isFirst = index === 0;
      const result = await provisionBusiness(prisma, {
        industryKey: industry.key,
        createOwnerUser: isFirst,
        ownerEmail: isFirst ? OWNER_EMAIL : undefined,
        ownerPassword: isFirst ? OWNER_PASSWORD : undefined,
      });
      created.push({ name: result.businessName, slug: result.slug });
    } catch (err) {
      if (err instanceof ProvisionError) {
        skipped += 1;
        continue;
      }
      throw err;
    }
  }

  if (!created.length) {
    console.log("\nNothing to do — every demo agenda already exists.\n");
  } else {
    console.log("\nSeed complete.\n");
    for (const business of created) {
      console.log(`  /${business.slug.padEnd(28)} ${business.name}`);
    }
    if (skipped) console.log(`\n  ${skipped} already existed and were skipped.`);
  }

  const admin = await prisma.user.findFirst({ where: { isPlatformAdmin: true } });
  console.log(`\nOne login runs all of them: ${admin?.email ?? OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log("Sign in at /admin, then open Negocios to switch between agendas.");
  console.log("Change this password before going anywhere near production.\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
