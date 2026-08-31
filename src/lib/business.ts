import { cache } from "react";
import { prisma } from "@/lib/db";

/**
 * This deployment always serves exactly one business (white-label model —
 * each client gets their own deployment + database). We still model it as
 * a row, not env vars or constants, so an owner can rebrand everything
 * from /admin/settings without touching code or redeploying.
 */
export const getBusiness = cache(async () => {
  const business = await prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
  if (!business) {
    throw new Error(
      "No Business record found. Run `npm run db:seed` to create the initial business profile."
    );
  }
  return business;
});

export type Business = Awaited<ReturnType<typeof getBusiness>>;
