import Link from "next/link";
import { countBusinesses } from "@/lib/business";
import { INDUSTRIES, DEFAULT_INDUSTRY_KEY } from "@/lib/industries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

export const metadata = { title: "Configuración inicial" };

/**
 * Alta de un negocio. Un mismo despliegue atiende a varios clientes, así que
 * este formulario se usa una vez por negocio: se elige el sector, se llenan
 * cuatro campos y queda creado con su propia URL, servicios, equipo y
 * horarios de ejemplo.
 */
export default async function SetupPage() {
  const existing = await countBusinesses();

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <Card className="w-full max-w-xl">
        <CardContent className="space-y-6 py-10">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Alta de negocio</p>
            <h1 className="text-2xl font-bold">Crea una agenda nueva</h1>
            <p className="text-sm text-muted-foreground">
              Elige el sector y creamos los servicios, el equipo y los horarios de ejemplo para que veas la
              agenda funcionando desde el primer minuto. Todo se puede cambiar después.
            </p>
            <p className="text-sm text-muted-foreground">
              El negocio queda publicado en su propia URL —{" "}
              <code className="rounded bg-secondary px-1 py-0.5 text-xs">/nombre-del-negocio</code> — y ese es el
              enlace que le pasas al cliente. Puedes repetir este paso para cada negocio que vendas.
            </p>
          </div>

          <form method="POST" action="/api/setup" className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="industry">Sector del negocio</Label>
              <select
                id="industry"
                name="industry"
                defaultValue={DEFAULT_INDUSTRY_KEY}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
              >
                {INDUSTRIES.map((industry) => (
                  <option key={industry.key} value={industry.key}>
                    {industry.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">
                Define los servicios, precios y colores de ejemplo que verás al entrar.
              </p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="business">Nombre del negocio</Label>
              <Input id="business" name="business" placeholder="Ej: Salón Aurora" />
              <p className="text-xs text-muted-foreground">Si lo dejas vacío usamos el nombre de ejemplo del sector.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo del administrador</Label>
                <Input id="email" name="email" type="email" required placeholder="tu@negocio.com" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Contraseña</Label>
                <Input id="password" name="password" type="password" required minLength={8} />
                <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="secret">Clave de instalación</Label>
              <Input id="secret" name="secret" required className="font-mono" />
              <p className="text-xs text-muted-foreground">
                Es el valor de la variable <code>SETUP_SECRET</code> configurada en este despliegue.
              </p>
            </div>

            <Button type="submit" variant="brand" className="w-full">
              Crear la agenda
            </Button>
          </form>

          {existing > 0 ? (
            <p className="text-center text-xs text-muted-foreground">
              Ya hay {existing} {existing === 1 ? "negocio" : "negocios"} en este despliegue.{" "}
              <Link href="/" className="underline underline-offset-2">
                Ver el directorio
              </Link>
              .
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
