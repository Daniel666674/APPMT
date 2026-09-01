import { PrismaClient } from "@prisma/client";
import { provisionBusiness } from "../src/lib/provision";

const prisma = new PrismaClient();

const OWNER_EMAIL = process.env.SEED_OWNER_EMAIL ?? "owner@example.com";
const OWNER_PASSWORD = process.env.SEED_OWNER_PASSWORD ?? "changeme123";

async function main() {
  const result = await provisionBusiness(prisma, {
    ownerEmail: OWNER_EMAIL,
    ownerPassword: OWNER_PASSWORD,
  });

  if (result.alreadyProvisioned) {
    console.log(`\nAlready set up — "${result.businessName}" already has a Business row. Nothing to do.\n`);
    return;
  }

  console.log("\nSeed complete.");
  console.log(`Business: ${result.businessName}`);
  console.log(`Admin login: ${OWNER_EMAIL} / ${OWNER_PASSWORD}`);
  console.log("Change this password immediately in production.\n");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
