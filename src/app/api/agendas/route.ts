import { NextRequest, NextResponse } from "next/server";
import { createAgenda } from "@/lib/agenda-creator";
import { getSession, isPlatformAdminUser } from "@/lib/auth";
import { ProvisionError } from "@/lib/provision";

/**
 * Creates an agenda. Two callers are allowed and no others:
 *
 *   - a signed-in platform admin, from the console at /admin/negocios;
 *   - whoever holds SETUP_SECRET, from /setup, which is how a fresh
 *     deployment gets its first agenda before any account exists.
 *
 * A client's own login is deliberately not enough: they administer their
 * agenda, they don't get to add more to someone else's deployment.
 */
export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Solicitud inválida" }, { status: 400 });

  const session = await getSession();
  const allowedBySession = session ? await isPlatformAdminUser(session.userId) : false;

  const expected = process.env.SETUP_SECRET;
  const allowedBySecret = Boolean(expected) && body.secret === expected;

  if (!allowedBySession && !allowedBySecret) {
    if (!expected && !session) {
      return NextResponse.json(
        { error: "Este despliegue no tiene SETUP_SECRET configurado. Agrégalo en Vercel y vuelve a desplegar." },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: "Clave de instalación incorrecta." }, { status: 401 });
  }

  try {
    const result = await createAgenda(body.agenda);
    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    if (err instanceof ProvisionError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[agendas] creation failed:", err);
    return NextResponse.json({ error: "No pudimos crear la agenda. Intenta de nuevo." }, { status: 500 });
  }
}
