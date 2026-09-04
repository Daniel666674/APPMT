import "server-only";
import { del, put } from "@vercel/blob";

export class UploadError extends Error {}

const MAX_BYTES = 5 * 1024 * 1024; // 5 MB — plenty for a logo or a hero photo.
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp", "image/svg+xml", "image/x-icon"]);

/** True once BLOB_READ_WRITE_TOKEN exists — Vercel injects it once a Blob store is connected. */
export function uploadsConfigured() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/**
 * Stores one image and returns its public URL.
 *
 * Scoped under `<scope>/` (a businessId, or a throwaway draft id for the
 * creator wizard before an agenda exists) purely to keep the store readable —
 * nothing here trusts the scope for authorization. That check happens in the
 * route handler, against the caller's actual session.
 */
export async function uploadImage(file: File, scope: string) {
  if (!uploadsConfigured()) {
    throw new UploadError(
      "La subida de archivos no está configurada en este despliegue. Falta la variable BLOB_READ_WRITE_TOKEN."
    );
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    throw new UploadError("Ese archivo no es una imagen válida (usa PNG, JPG, WEBP, SVG o ICO).");
  }
  if (file.size > MAX_BYTES) {
    throw new UploadError("La imagen pesa demasiado. El máximo es 5 MB.");
  }

  const safeScope = scope.replace(/[^a-zA-Z0-9_-]/g, "") || "draft";
  const extension = file.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g, "") || "png";

  const blob = await put(`agendas/${safeScope}/${crypto.randomUUID()}.${extension}`, file, {
    access: "public",
    // A fresh random name every time, so re-uploading a logo can never clash
    // with — or accidentally overwrite — a URL some other record still points at.
    addRandomSuffix: false,
  });

  return blob.url;
}

/** Best effort: an orphaned blob costs storage, not correctness, so a failure here is swallowed. */
export async function deleteImage(url: string) {
  try {
    await del(url);
  } catch {
    // Ignored on purpose — see above.
  }
}
