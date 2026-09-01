import Link from "next/link";
import { countBusinesses } from "@/lib/business";
import { prisma } from "@/lib/db";
import { INDUSTRIES } from "@/lib/industries";
import { AgendaCreator } from "@/components/creator/AgendaCreator";

export const dynamic = "force-dynamic";

/**
 * Bootstraps a deployment: the first agenda, and with it the first account,
 * before anyone can sign in. Once that account exists the same creator is
 * available (without the secret) at /admin/negocios.
 */
export default async function SetupPage() {
  const [existing, accounts] = await Promise.all([countBusinesses(), prisma.user.count()]);
  const isFirstRun = accounts === 0;

  return (
    <div className="min-h-screen bg-secondary/30 px-4 py-10">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Nueva agenda</p>
          <h1 className="text-2xl font-bold">
            {isFirstRun ? "Pon en marcha tu herramienta" : "Crea una agenda en dos minutos"}
          </h1>
          <p className="max-w-2xl text-sm text-muted-foreground">
            {isFirstRun
              ? "Esta primera agenda crea también tu cuenta de administrador: el único usuario que necesitas, y con el que después manejas todas las demás."
              : "Escoge el sector, ponle la marca del cliente y publícala en su propia dirección web. Vas viendo la página real mientras la armas."}
          </p>
          {existing > 0 ? (
            <p className="text-sm text-muted-foreground">
              Ya hay {existing} {existing === 1 ? "agenda" : "agendas"} en este despliegue.{" "}
              <Link href="/" className="underline underline-offset-2">
                Ver la biblioteca
              </Link>{" "}
              ·{" "}
              <Link href="/admin" className="underline underline-offset-2">
                Entrar al panel
              </Link>
            </p>
          ) : null}
        </header>

        <div className="rounded-xl border border-border bg-card p-5 shadow-sm sm:p-6">
          <AgendaCreator industries={INDUSTRIES} mode="setup" isFirstRun={isFirstRun} />
        </div>
      </div>
    </div>
  );
}
