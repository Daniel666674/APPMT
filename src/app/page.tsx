import Link from "next/link";
import { CalendarDays } from "lucide-react";
import { listBusinesses } from "@/lib/business";
import { INDUSTRIES } from "@/lib/industries";
import { ShareLink } from "@/components/directory/ShareLink";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Agendas en línea para tu negocio",
  description:
    "Cada negocio con su propia página de reservas: servicios, equipo, horarios y marca. Mira las demos.",
};

/**
 * The demo library — the page shown to a prospect. Every agenda on the
 * deployment that is marked `listed` appears here with its own link, so a
 * demo can be shared on its own or the whole library browsed by sector. A
 * real client is hidden from here with the Visibilidad switch in their
 * settings.
 */
export default async function DirectoryPage() {
  const businesses = await listBusinesses();

  return (
    <div className="min-h-screen bg-secondary/25">
      <header className="border-b border-border bg-card">
        <div className="mx-auto max-w-6xl px-4 py-12 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Agendas en línea
          </p>
          <h1 className="mt-2 text-3xl font-bold sm:text-4xl">
            Tus clientes reservan solos, a cualquier hora
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-sm text-muted-foreground sm:text-base">
            Cada negocio tiene su propia página con su marca, sus servicios y sus horarios. El cliente
            escoge y reserva desde el celular, sin llamar y sin crear cuenta. Entra a cualquiera de estas
            demos y pruébala como si fueras el cliente.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        {businesses.length === 0 ? (
          <EmptyLibrary />
        ) : (
          <>
            <p className="mb-4 text-sm text-muted-foreground">
              {businesses.length} {businesses.length === 1 ? "agenda" : "agendas"} para mirar.
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {businesses.map((business) => (
                <article
                  key={business.id}
                  className="group flex flex-col rounded-xl border border-border bg-card p-5 shadow-sm transition hover:shadow-md"
                >
                  <Link href={`/${business.slug}`} className="flex-1">
                    <span
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-base font-bold text-white"
                      style={{
                        background: `linear-gradient(135deg, ${business.primaryColor}, ${business.accentColor})`,
                      }}
                    >
                      {business.name.slice(0, 1).toUpperCase()}
                    </span>
                    <h2 className="mt-3 font-semibold group-hover:text-brand">{business.name}</h2>
                    <p className="font-mono text-xs text-muted-foreground">/{business.slug}</p>
                    {business.heroSubheadline ? (
                      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                        {business.heroSubheadline}
                      </p>
                    ) : null}
                  </Link>

                  <div className="mt-4 flex items-center justify-between border-t border-border pt-3">
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {business._count.services} servicios
                    </span>
                    <ShareLink slug={business.slug} name={business.name} />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <section className="mt-12 rounded-xl border border-border bg-card p-6">
          <h2 className="text-lg font-bold">Sirve para cualquier negocio con citas</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Cada sector arranca con sus servicios, precios y equipo ya cargados. Todo se cambia después
            desde el panel.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {INDUSTRIES.map((industry) => (
              <li
                key={industry.key}
                className="flex items-center gap-1.5 rounded-full border border-border px-3 py-1 text-xs"
              >
                <span className="h-2 w-2 rounded-full" style={{ background: industry.primaryColor }} />
                {industry.label}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <footer className="border-t border-border py-6 text-center text-xs text-muted-foreground">
        <Link href="/admin" className="hover:text-foreground">
          Entrar al panel
        </Link>
      </footer>
    </div>
  );
}

function EmptyLibrary() {
  return (
    <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
      <h2 className="text-lg font-bold">Todavía no hay agendas</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
        Crea la primera desde{" "}
        <Link href="/setup" className="underline underline-offset-2">
          /setup
        </Link>
        . Necesitas la clave de instalación (<code>SETUP_SECRET</code>) de este despliegue.
      </p>
    </div>
  );
}
