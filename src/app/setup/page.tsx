import Link from "next/link";
import { getBusinessOrNull } from "@/lib/business";
import { INDUSTRIES, DEFAULT_INDUSTRY_KEY } from "@/lib/industries";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const dynamic = "force-dynamic";

export const metadata = { title: "Configuración inicial" };

/**
 * Formulario de configuración inicial. Reemplaza el tener que armar a mano
 * una URL con parámetros: se elige el sector, se llenan cuatro campos y el
 * negocio queda creado con servicios, equipo y horarios de ejemplo.
 */
export default async function SetupPage() {
  const business = await getBusinessOrNull();

  if (business) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="space-y-4 py-10 text-center">
            <h1 className="text-xl font-bold">Ya está configurado</h1>
            <p className="text-sm text-muted-foreground">
              «{business.name}» ya tiene su negocio y usuario creados. Esta página solo funciona una vez.
            </p>
            <Button asChild variant="brand">
              <Link href="/admin">Ir al panel</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <Card className="w-full max-w-xl">
        <CardContent className="space-y-6 py-10">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Configuración inicial</p>
            <h1 className="text-2xl font-bold">Pon en marcha tu agenda</h1>
            <p className="text-sm text-muted-foreground">
              Elige el sector y creamos los servicios, el equipo y los horarios de ejemplo para que veas la
              agenda funcionando desde el primer minuto. Todo se puede cambiar después.
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
              Crear mi agenda
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
