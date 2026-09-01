import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { provisionBusiness } from "@/lib/provision";

/**
 * Configuración inicial, en un solo paso y desde el navegador: crea el
 * negocio y el usuario administrador sin necesidad de tener Node.js
 * instalado. Protegido con SETUP_SECRET para que nadie más pueda reclamar
 * una instalación recién desplegada. Se desactiva solo en cuanto existe un
 * negocio, así que es seguro dejarlo publicado.
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

  const result = await provisionBusiness(prisma, {
    ownerEmail: email,
    ownerPassword: input.password,
    businessName: input.businessName ?? undefined,
    industryKey: input.industryKey ?? undefined,
  });

  if (result.alreadyProvisioned) {
    return page(
      409,
      "Ya está configurado",
      `«${result.businessName}» ya tiene negocio y usuario administrador. Este enlace solo funciona una vez. Inicia sesión en <a href="/admin">/admin</a>.`
    );
  }

  return page(
    200,
    "¡Listo!",
    `Creamos «${result.businessName}» con el usuario <b>${result.ownerEmail}</b>. Entra a <a href="/admin">/admin</a> con ese correo y la contraseña que acabas de elegir, y personaliza todo desde Configuración. Este enlace ya no volverá a funcionar.`,
    true
  );
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
