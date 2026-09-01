import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientIpFrom, rateLimit } from "@/lib/rate-limit";

/**
 * Creates the superadmin account, and nothing else.
 *
 * Whoever runs this deployment belongs to no business — they run all of
 * them — so this asks for an email, a password and the setup key, and never
 * for a sector, a name or a brand. Agendas come afterwards, from the
 * console, where one click fills the whole demo library.
 *
 * Only works while no account exists. Once there is one, recovery lives at
 * /recuperar and new agendas at /admin/negocios.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFrom(request.headers);
  const limited = rateLimit(`setup:${ip}`, 10, 10 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json({ error: "Demasiados intentos. Espera unos minutos." }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });

  const expected = process.env.SETUP_SECRET;
  if (!expected) {
    return NextResponse.json(
      { error: "Este despliegue no tiene SETUP_SECRET configurado. Agrégalo en Vercel y vuelve a desplegar." },
      { status: 500 }
    );
  }
  if (body.secret !== expected) {
    return NextResponse.json({ error: "La clave de instalación no coincide." }, { status: 401 });
  }

  if ((await prisma.user.count()) > 0) {
    return NextResponse.json(
      { error: "Este despliegue ya tiene una cuenta. Si olvidaste la contraseña, usa /recuperar." },
      { status: 409 }
    );
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const password = typeof body.password === "string" ? body.password : "";
  if (!email.includes("@")) {
    return NextResponse.json({ error: "Escribe un correo válido." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: "La contraseña debe tener mínimo 8 caracteres." }, { status: 400 });
  }

  const user = await prisma.user.create({
    data: {
      email,
      passwordHash: await hashPassword(password),
      name: "Administrador",
      role: "OWNER",
      isPlatformAdmin: true,
      businessId: null,
    },
  });

  return NextResponse.json({ email: user.email }, { status: 201 });
}
