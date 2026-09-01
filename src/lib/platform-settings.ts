import "server-only";
import { prisma } from "@/lib/db";
import type { PlatformSettingsInput } from "@/lib/validations";

/**
 * Deployment-wide preferences for the reseller console, stored as key/value
 * so a new one never needs a migration. Nothing here is tenant data — a
 * business owner can neither read nor write it.
 */
export const PLATFORM_DEFAULTS: Record<string, string> = {
  resellerName: "",
  resellerWhatsapp: "",
  publicDirectoryTitle: "",
  publicDirectorySubtitle: "",
  defaultCity: "Bogotá",
  monthlyPrice: "",
  setupPrice: "",
};

export async function getPlatformSettings() {
  const rows = await prisma.platformSetting.findMany();
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...PLATFORM_DEFAULTS, ...stored };
}

export async function savePlatformSettings(data: PlatformSettingsInput) {
  const entries = Object.entries(data).map(([key, value]) => ({
    key,
    value: value === null || value === undefined ? "" : String(value),
  }));

  await prisma.$transaction(
    entries.map((entry) =>
      prisma.platformSetting.upsert({
        where: { key: entry.key },
        update: { value: entry.value },
        create: entry,
      })
    )
  );
}
