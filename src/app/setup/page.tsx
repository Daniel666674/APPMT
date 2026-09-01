import Link from "next/link";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { SetupForm } from "./SetupForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Crear mi cuenta",
  robots: { index: false, follow: false },
};

/**
 * First run: the superadmin account. Once one exists this page has no job,
 * so it steps aside — new agendas come from the console, and a forgotten
 * password from /recuperar.
 */
export default async function SetupPage() {
  // Once an account exists this page has no job — but bouncing straight to
  // the login tells the person nothing, and the reason they came here is
  // usually that they don't know the credentials. So it says so, and points
  // at the page that can actually help.
  if ((await prisma.user.count()) > 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
        <div className="w-full max-w-md space-y-4">
          <div className="text-center">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Ya configurado</p>
            <h1 className="mt-1 text-2xl font-bold">Este despliegue ya tiene su cuenta</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Por eso esta página no crea otra. Solo puede existir una cuenta principal.
            </p>
          </div>

          <Card>
            <CardContent className="space-y-4 py-6">
              <div className="space-y-1">
                <h2 className="text-sm font-semibold">¿No recuerdas el correo o la contraseña?</h2>
                <p className="text-sm text-muted-foreground">
                  Entra a recuperar tu acceso con la clave de instalación. Ahí te mostramos con qué correo
                  quedó creada la cuenta y puedes ponerle una contraseña nueva.
                </p>
              </div>
              <Button asChild variant="brand" className="w-full">
                <Link href="/recuperar">Recuperar mi acceso</Link>
              </Button>
              <Button asChild variant="outline" className="w-full">
                <Link href="/admin/login">Ya me acordé, entrar</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Primer paso</p>
          <h1 className="mt-1 text-2xl font-bold">Crea tu cuenta</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Es la única cuenta que necesitas. Con ella creas y manejas todas las agendas.
          </p>
        </div>

        <Card>
          <CardContent className="py-6">
            <SetupForm />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          ¿Ya tienes cuenta?{" "}
          <Link href="/admin/login" className="underline underline-offset-2">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}
