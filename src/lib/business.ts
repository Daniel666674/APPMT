import { cache } from "react";
import type { Business as BusinessModel } from "@prisma/client";
import { prisma } from "@/lib/db";

export type Business = BusinessModel;

/**
 * This deployment serves many businesses at once. Each one lives at its own
 * URL (`/<slug>`) and owns its staff, services, customers and bookings.
 *
 * Every query in the app is scoped by business, and there are exactly two
 * ways to establish which business you're in:
 *
 *   - Public pages resolve it from the URL slug — getBusinessBySlug().
 *   - Admin pages resolve it from the signed-in session — see
 *     requireBusinessSession() in lib/auth.ts.
 *
 * Nothing should ever load a business any other way; that's what keeps one
 * tenant's data out of another's pages.
 */
export const getBusinessBySlug = cache(async (slug: string) => {
  return prisma.business.findUnique({ where: { slug } });
});

export const getBusinessById = cache(async (id: string) => {
  return prisma.business.findUnique({ where: { id } });
});

/** Businesses shown in the public directory at `/`. */
export const listBusinesses = cache(async () => {
  return prisma.business.findMany({
    where: { listed: true },
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      accentColor: true,
      city: true,
      heroSubheadline: true,
      _count: { select: { services: { where: { active: true } } } },
    },
  });
});

export const countBusinesses = cache(async () => prisma.business.count());

/** Turns a business name into a URL-safe slug. */
export function slugify(input: string) {
  return (
    input
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "negocio"
  );
}

/**
 * Slugs that would collide with the app's own top-level routes. A business
 * can't claim one of these, or its booking page would be unreachable.
 */
export const RESERVED_SLUGS = new Set([
  "admin",
  "api",
  "setup",
  "recuperar",
  "manage",
  "_next",
  "favicon.ico",
]);

/** Finds a free slug, appending -2, -3, … if the base is taken or reserved. */
export async function findAvailableSlug(base: string) {
  const root = slugify(base);
  for (let i = 1; i < 100; i++) {
    const candidate = i === 1 ? root : `${root}-${i}`;
    if (RESERVED_SLUGS.has(candidate)) continue;
    const taken = await prisma.business.findUnique({ where: { slug: candidate }, select: { id: true } });
    if (!taken) return candidate;
  }
  return `${root}-${Date.now()}`;
}
