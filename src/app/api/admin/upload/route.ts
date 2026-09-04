import { NextResponse } from "next/server";
import { isPlatformAdminUser, requireSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { UploadError, uploadImage } from "@/lib/blob";

export const dynamic = "force-dynamic";

/**
 * Uploads one image (logo, favicon, hero photo) and returns its public URL.
 *
 * Who may write where mirrors the rest of the admin: a platform admin can
 * upload for any business (or none yet — the creator wizard has no agenda to
 * scope to until it saves), a business owner only for their own, and neither
 * check is skippable by a client-supplied businessId.
 */
export async function POST(request: Request) {
  const session = await requireSession();

  const form = await request.formData();
  const file = form.get("file");
  const businessId = form.get("businessId");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Falta el archivo." }, { status: 400 });
  }
  if (businessId !== null && typeof businessId !== "string") {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const isPlatformAdmin = await isPlatformAdminUser(session.userId);

  let scope = "draft";
  if (businessId) {
    if (isPlatformAdmin) {
      const exists = await prisma.business.findUnique({ where: { id: businessId }, select: { id: true } });
      if (!exists) return NextResponse.json({ error: "Esta agenda ya no existe." }, { status: 404 });
    } else if (businessId !== session.businessId) {
      // A business owner can only ever upload into their own agenda — the
      // same boundary requireBusinessSession enforces for every other write.
      return NextResponse.json({ error: "No autorizado." }, { status: 403 });
    }
    scope = businessId;
  } else if (!isPlatformAdmin) {
    // No businessId means "draft, not saved yet" — only the creator wizard
    // does that, and only a platform admin runs the creator.
    return NextResponse.json({ error: "No autorizado." }, { status: 403 });
  }

  try {
    const url = await uploadImage(file, scope);
    return NextResponse.json({ url });
  } catch (err) {
    if (err instanceof UploadError) {
      return NextResponse.json({ error: err.message }, { status: 422 });
    }
    throw err;
  }
}
