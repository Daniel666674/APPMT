"use server";

import { revalidatePath } from "next/cache";
import { requirePlatformAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { prospectSchema } from "@/lib/validations";

/** The whole CRM is reseller-only. Nothing here is tenant data. */
async function guard() {
  await requirePlatformAdmin();
}

function parse(input: unknown) {
  const parsed = prospectSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const d = parsed.data;
  return {
    name: d.name,
    company: d.company || null,
    email: d.email || null,
    phone: d.phone || null,
    city: d.city || null,
    sector: d.sector || null,
    status: d.status,
    source: d.source || null,
    value: d.value ?? null,
    notes: d.notes || null,
    businessId: d.businessId || null,
    // Stored at noon Bogotá so a date-only follow-up never lands on the day
    // before once it is read back in local time.
    nextFollowUpAt: d.nextFollowUpAt ? new Date(`${d.nextFollowUpAt}T12:00:00-05:00`) : null,
  };
}

export async function createProspect(input: unknown) {
  await guard();
  const prospect = await prisma.prospect.create({ data: parse(input) });
  revalidatePath("/admin/prospectos");
  revalidatePath("/admin", "layout");
  return { id: prospect.id };
}

export async function updateProspect(id: string, input: unknown) {
  await guard();
  await prisma.prospect.update({ where: { id }, data: parse(input) });
  revalidatePath("/admin/prospectos");
  revalidatePath("/admin", "layout");
}

/**
 * Moving a prospect along the pipeline is the one thing I do on every call,
 * so it is its own action rather than a trip through the whole form.
 */
export async function setProspectStatus(id: string, status: string) {
  await guard();
  const parsed = prospectSchema.shape.status.safeParse(status);
  if (!parsed.success) throw new Error("Estado inválido");

  await prisma.prospect.update({
    where: { id },
    data: { status: parsed.data, lastContactedAt: new Date() },
  });
  revalidatePath("/admin/prospectos");
  revalidatePath("/admin", "layout");
}

export async function deleteProspect(id: string) {
  await guard();
  // The demo agenda built for this lead survives: DemoShare.prospectId and
  // Prospect.businessId are both SET NULL, so deleting a contact never takes
  // an agenda or its history with it.
  await prisma.prospect.delete({ where: { id } });
  revalidatePath("/admin/prospectos");
  revalidatePath("/admin", "layout");
}
