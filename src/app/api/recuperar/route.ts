import { NextRequest, NextResponse } from "next/server";
import { hashPassword } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { clientIpFrom, rateLimit } from "@/lib/rate-limit";

/**
 * Account recovery for whoever runs the deployment.
 *
 * There is no "forgot my password" email, so without this the only way back
 * into a locked-out account is raw SQL against production — which the person
 * who owns this product should never have to write.
 *
 * The gate is SETUP_SECRET, the same key that already creates businesses
 * here. That is a deliberate equivalence: whoever holds it controls this
 * deployment either way, and it is the one credential the owner keeps
 * outside the app. It is rate-limited, and it reveals nothing at all
 * without the secret.
 */
export async function POST(request: NextRequest) {
  const ip = clientIpFrom(request.headers);
  const limited = rateLimit(`recuperar:${ip}`, 10, 10 * 60 * 1000);
  if (!limited.allowed) {
    return NextResponse.json(
      { error: "Demasiados intentos. Espera unos minutos e intenta de nuevo." },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });

  const expected = process.env.SETUP_SECRET;
  if (!expected) {
    return NextResponse.json(
      {
        error:
          "Este despliegue no tiene SETUP_SECRET configurado. Agrégalo en Vercel, vuelve a desplegar e intenta de nuevo.",
      },
      { status: 500 }
    );
  }
  if (body.secret !== expected) {
    return NextResponse.json({ error: "La clave de instalación no coincide." }, { status: 401 });
  }

  if (body.action === "list") {
    const accounts = await prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      select: {
        email: true,
        name: true,
        isPlatformAdmin: true,
        active: true,
        business: { select: { name: true, slug: true } },
      },
    });
    return NextResponse.json({ accounts });
  }

  if (body.action === "reset") {
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!email) return NextResponse.json({ error: "Escoge una cuenta." }, { status: 400 });
    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener mínimo 8 caracteres." }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ error: "No encontramos esa cuenta." }, { status: 404 });

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await hashPassword(password), active: true },
    });

    // A deployment with nobody holding platform access has nobody who can
    // reach the console, which would leave the owner shut out of their own
    // agendas. Recovering an account is the right moment to repair that.
    const admins = await prisma.user.count({ where: { isPlatformAdmin: true, active: true } });
    let promoted = false;
    if (admins === 0) {
      await prisma.user.update({ where: { id: user.id }, data: { isPlatformAdmin: true } });
      promoted = true;
    }

    return NextResponse.json({
      email: user.email,
      isPlatformAdmin: promoted || user.isPlatformAdmin,
      promoted,
    });
  }

  return NextResponse.json({ error: "Acción desconocida" }, { status: 400 });
}
