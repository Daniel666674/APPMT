import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

/**
 * Se muestra cuando el despliegue funciona pero la base de datos todavía no
 * tiene un negocio creado. Reemplaza lo que antes era un error y sirve como
 * punto de entrada a la configuración inicial.
 */
export function SetupNeeded() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <Card className="w-full max-w-md">
        <CardContent className="space-y-5 py-10 text-center">
          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Casi listo</p>
            <h1 className="text-2xl font-bold">Esta agenda aún no está configurada</h1>
            <p className="text-sm text-muted-foreground">
              La aplicación se desplegó correctamente y la base de datos está conectada. Solo falta crear el
              negocio y el usuario administrador.
            </p>
          </div>

          <Button asChild variant="brand" className="w-full">
            <Link href="/setup">Configurar ahora</Link>
          </Button>

          <p className="text-sm text-muted-foreground">
            ¿Ya está configurada?{" "}
            <Link href="/admin" className="font-medium text-brand hover:underline">
              Inicia sesión
            </Link>
            .
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
