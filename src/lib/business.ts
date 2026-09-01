import { cache } from "react";
import type { Business as BusinessModel } from "@prisma/client";
import { prisma } from "@/lib/db";

export type Business = BusinessModel;

/**
 * This deployment always serves exactly one business (white-label model —
 * each client gets their own deployment + database). We still model it as
 * a row, not env vars or constants, so an owner can rebrand everything
 * from /admin/settings without touching code or redeploying.
 *
 * Returns null before the deployment has been set up (see /api/setup).
 * A brand-new deployment builds and serves fine with an empty database —
 * callers render a "not set up yet" state rather than crashing, which is
 * what makes deploy-then-configure possible.
 */
export const getBusinessOrNull = cache(async () => {
  return prisma.business.findFirst({ orderBy: { createdAt: "asc" } });
});

/**
 * For contexts that genuinely cannot proceed without a business (the admin
 * dashboard, booking APIs). Only reachable after setup has run.
 */
export const getBusiness = cache(async (): Promise<Business> => {
  const business = await getBusinessOrNull();
  if (!business) {
    throw new Error(
      "No Business record found. Visit /api/setup to create the initial business profile."
    );
  }
  return business;
});
