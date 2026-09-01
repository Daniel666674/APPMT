"use server";

import { revalidatePath } from "next/cache";
import {
  clearSessionCookie,
  createSessionCookie,
  hashPassword,
  isPlatformAdminUser,
  requireSession,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/db";
import { accountPasswordSchema, accountProfileSchema } from "@/lib/validations";

/**
 * Updates the signed-in person's own name and email. The session carries
 * both for display, so it is re-issued rather than left stale.
 */
export async function updateAccountProfile(input: unknown) {
  const session = await requireSession();
  const parsed = accountProfileSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  const { name, email } = parsed.data;

  const clash = await prisma.user.findUnique({ where: { email }, select: { id: true } });
  if (clash && clash.id !== session.userId) {
    throw new Error(`Ya existe una cuenta con el correo ${email}.`);
  }

  const user = await prisma.user.update({
    where: { id: session.userId },
    data: { name, email },
  });

  await createSessionCookie({
    userId: user.id,
    businessId: session.businessId,
    email: user.email,
    name: user.name,
    role: user.role,
    isPlatformAdmin: await isPlatformAdminUser(user.id),
  });

  revalidatePath("/admin", "layout");
}

/**
 * Changes the signed-in person's password. The current one is required, so
 * a borrowed open session can't lock the real owner out.
 */
export async function updateAccountPassword(input: unknown) {
  const session = await requireSession();
  const parsed = accountPasswordSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");

  const user = await prisma.user.findUnique({ where: { id: session.userId } });
  if (!user) {
    await clearSessionCookie();
    throw new Error("Tu sesión ya no es válida. Vuelve a entrar.");
  }

  if (!(await verifyPassword(parsed.data.currentPassword, user.passwordHash))) {
    throw new Error("La contraseña actual no coincide.");
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: await hashPassword(parsed.data.newPassword) },
  });
}
