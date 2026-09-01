import Link from "next/link";
import { requireBusinessSession } from "@/lib/auth";
import { countBusinesses } from "@/lib/business";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileForm, PasswordForm } from "./AccountForms";

export const dynamic = "force-dynamic";

/**
 * The signed-in person's own account, as opposed to /admin/settings which is
 * the business they are standing in. Separating the two matters here: a
 * platform admin's account is the single login behind every agenda, so
 * changing its password is not a per-business action.
 */
export default async function CuentaPage() {
  const { session, business, isPlatformAdmin } = await requireBusinessSession();

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { name: true, email: true, createdAt: true },
  });
  if (!user) return null;

  const agendas = isPlatformAdmin ? await countBusinesses() : 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mi cuenta</h1>
        <p className="text-sm text-muted-foreground">
          Tus datos de acceso. Esto es tuyo, no del negocio — para cambiar lo que ven tus clientes ve a{" "}
          <Link href="/admin/settings" className="underline underline-offset-2">
            Configuración
          </Link>
          .
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex flex-wrap items-center gap-2">
            Acceso
            {isPlatformAdmin ? <Badge variant="success">Cuenta principal</Badge> : null}
          </CardTitle>
          <CardDescription>
            {isPlatformAdmin
              ? `Con esta cuenta entras a las ${agendas} agendas de este despliegue. Es el único correo y la única contraseña que necesitas.`
              : `Esta cuenta administra «${business.name}» y solo esa agenda.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ProfileForm initial={{ name: user.name, email: user.email }} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cambiar contraseña</CardTitle>
          <CardDescription>
            Pedimos la actual para que nadie pueda cambiarla desde una sesión que dejaste abierta.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PasswordForm />
        </CardContent>
      </Card>
    </div>
  );
}
