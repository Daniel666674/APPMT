import Link from "next/link";
import { ArrowRight, CalendarDays } from "lucide-react";
import { listBusinesses } from "@/lib/business";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export const metadata = { title: "Agenda de citas" };

/**
 * Directory of every business on this deployment. Doubles as a demo
 * showcase: each card links to a fully working booking site.
 */
export default async function DirectoryPage() {
  const businesses = await listBusinesses();

  return (
    <div className="flex min-h-screen flex-col bg-secondary/30">
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Agenda de citas</h1>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            Cada negocio tiene su propia página de reservas. Elige uno para ver cómo funciona.
          </p>
        </div>

        {businesses.length === 0 ? (
          <Card className="mx-auto max-w-md">
            <CardContent className="space-y-4 py-10 text-center">
              <h2 className="text-lg font-semibold">Todavía no hay negocios</h2>
              <p className="text-sm text-muted-foreground">
                Crea el primero desde la página de configuración.
              </p>
              <Button asChild variant="brand">
                <Link href="/setup">Crear un negocio</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {businesses.map((business) => (
              <Link key={business.id} href={`/${business.slug}`}>
                <Card className="h-full transition-shadow hover:shadow-md">
                  <CardContent className="flex h-full flex-col gap-3 p-6">
                    <div
                      className="flex h-10 w-10 items-center justify-center rounded-lg text-sm font-bold text-white"
                      style={{ backgroundColor: business.primaryColor }}
                    >
                      {business.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h2 className="font-semibold leading-tight">{business.name}</h2>
                      <p className="mt-0.5 font-mono text-xs text-muted-foreground">/{business.slug}</p>
                    </div>
                    {business.heroSubheadline ? (
                      <p className="line-clamp-2 text-sm text-muted-foreground">{business.heroSubheadline}</p>
                    ) : null}
                    <div className="mt-auto flex items-center justify-between pt-2 text-sm text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5" />
                        {business._count.services} servicios
                      </span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}

        <div className="mt-12 flex flex-wrap items-center justify-center gap-3 text-sm">
          <Button asChild variant="outline" size="sm">
            <Link href="/setup">Crear otro negocio</Link>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/admin">Panel de administración</Link>
          </Button>
        </div>
      </main>
    </div>
  );
}
