import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { ProvisionError, provisionBusiness } from "@/lib/provision";

/**
 * Alta de un negocio nuevo, en un solo paso y desde el navegador: crea el
 * negocio, su usuario administrador y datos de ejemplo del sector, sin
 * necesidad de tener Node.js instalado.
 *
 * Este despliegue atiende a muchos negocios a la vez, así que el formulario
 * se puede usar tantas veces como clientes tengas: cada llamada crea un
 * negocio independiente con su propia URL (`/su-negocio`). Va protegido con
 * SETUP_SECRET porque es precisamente lo que impide que un desconocido dé
 * de alta negocios en tu instalación.
 *
 * Acepta POST (desde el formulario en /setup) y GET (con parámetros en la
 * URL, útil para automatizar).
 */
export async function POST(request: NextRequest) {
  const form = await request.formData().catch(() => null);
  if (!form) return page(400, "Solicitud inválida", "No se recibieron los datos del formulario.");
  return handleSetup({
    secret: str(form.get("secret")),
    email: str(form.get("email")),
    password: str(form.get("password")),
    businessName: str(form.get("business")),
    industryKey: str(form.get("industry")),
  });
}

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  return handleSetup({
    secret: params.get("secret"),
    email: params.get("email"),
    password: params.get("password"),
    businessName: params.get("business"),
    industryKey: params.get("industry"),
  });
}

async function handleSetup(input: {
  secret: string | null;
  email: string | null;
  password: string | null;
  businessName: string | null;
  industryKey: string | null;
}) {
  const email = input.email?.trim().toLowerCase();
  const expected = process.env.SETUP_SECRET;

  if (!expected) {
    return page(
      500,
      "Falta configurar SETUP_SECRET",
      "Esta instalación todavía no tiene la variable de entorno <code>SETUP_SECRET</code>. Agrégala en Vercel, vuelve a desplegar e intenta de nuevo."
    );
  }
  if (input.secret !== expected) {
    return page(
      401,
      "Clave incorrecta",
      "La clave de instalación no coincide con <code>SETUP_SECRET</code>. Revisa que la hayas copiado completa."
    );
  }
  if (!email || !email.includes("@")) {
    return page(400, "Falta el correo", "Escribe un correo electrónico válido para la cuenta de administrador.");
  }
  if (!input.password || input.password.length < 8) {
    return page(400, "Contraseña muy corta", "La contraseña debe tener al menos 8 caracteres.");
  }

  let result;
  try {
    result = await provisionBusiness(prisma, {
      ownerEmail: email,
      ownerPassword: input.password,
      businessName: input.businessName ?? undefined,
      industryKey: input.industryKey ?? undefined,
    });
  } catch (err) {
    if (err instanceof ProvisionError) {
      return page(409, "No pudimos crear el negocio", escapeHtml(err.message));
    }
    console.error("[setup] provisioning failed:", err);
    return page(500, "Algo salió mal", "No pudimos crear el negocio. Revisa los registros del despliegue e inténtalo de nuevo.");
  }

  const bookingUrl = `/${result.slug}`;
  return page(
    200,
    "¡Listo!",
    `Creamos «${escapeHtml(result.businessName)}» con el usuario <b>${escapeHtml(result.ownerEmail)}</b>.
     Su página de reservas es <a href="${bookingUrl}">${escapeHtml(bookingUrl)}</a> — ese es el enlace que le compartes al cliente.
     Para administrarla, entra a <a href="/admin">/admin</a> con ese correo y la contraseña que acabas de elegir.
     Puedes volver a <a href="/setup">/setup</a> cuando quieras para dar de alta otro negocio.`,
    true
  );
}

/** El nombre del negocio lo escribe quien usa el formulario: se escapa antes de incrustarlo. */
function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function str(value: FormDataEntryValue | null) {
  return typeof value === "string" ? value : null;
}

function page(status: number, title: string, body: string, success = false) {
  const color = success ? "#0f766e" : status >= 500 ? "#b91c1c" : "#b45309";
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<style>
  body{font-family:ui-sans-serif,system-ui,sans-serif;background:#f4f6f8;color:#10161d;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0;padding:24px;}
  .card{max-width:480px;background:#fff;border:1px solid #dbe1e7;border-radius:12px;padding:32px;box-shadow:0 8px 24px rgba(16,22,29,.06);}
  h1{margin:0 0 12px;font-size:1.3rem;color:${color};}
  p{margin:0;line-height:1.6;color:#4b5867;}
  a{color:#0f766e;}
  code{background:#f1f5f9;padding:1px 5px;border-radius:4px;font-size:.9em;}
</style></head>
<body><div class="card"><h1>${title}</h1><p>${body}</p></div></body></html>`;
  return new NextResponse(html, { status, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
