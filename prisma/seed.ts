import { PrismaClient } from "@prisma/client";
import { INDUSTRIES } from "../src/lib/industries";
import { ProvisionError, provisionBusiness } from "../src/lib/provision";

const prisma = new PrismaClient();

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? "owner@example.com";
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "changeme123";

/**
 * Seeds one demo business per industry, each on its own URL. The result is a
 * showcase you can walk a prospect through — the same product wearing ten
 * different brands — rather than a single empty scheduler.
 *
 * The first industry gets SEED_OWNER_EMAIL so there's an account you can
 * actually sign into; the rest get placeholder owners. Businesses whose owner
 * email already exists are skipped, so re-running the seed is safe.
 */
async function main() {
  const created: { name: string; slug: string; email: string }[] = [];
  let skipped = 0;

  for (const [index, industry] of INDUSTRIES.entries()) {
    const ownerEmail = index === 0 ? OWNER_EMAIL : `demo.${industry.key}@example.com`;
    try {
      const result = await provisionBusiness(prisma, {
        ownerEmail,
        ownerPassword: OWNER_PASSWORD,
        industryKey: industry.key,
      });
      created.push({ name: result.businessName, slug: result.slug, email: result.ownerEmail });
    } catch (err) {
      if (err instanceof ProvisionError) {
        skipped += 1;
        continue;
      }
      throw err;
    }
  }

  if (!created.length) {
    console.log("\nNothing to do — every demo business already exists.\n");
    return;
  }

  console.log("\nSeed complete.\n");
  for (const business of created) {
    console.log(`  /${business.slug.padEnd(28)} ${business.name}  (${business.email})`);
  }
  if (skipped) console.log(`\n  ${skipped} already existed and were skipped.`);
  console.log(`\nAdmin login: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log("Every demo owner uses the same password. Change it before going anywhere near production.\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
