"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth";
import { savePlatformSettings } from "@/lib/platform-settings";
import { platformSettingsSchema } from "@/lib/validations";

export async function updatePlatformSettings(input: unknown) {
  await requirePlatformAdmin();
  const parsed = platformSettingsSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  await savePlatformSettings(parsed.data);
  revalidatePath("/admin/plataforma");
  revalidatePath("/");
}
