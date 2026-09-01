import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { RecoveryForm } from "./RecoveryForm";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Recuperar mi acceso",
  robots: { index: false, follow: false },
};

/**
 * The way back in when nobody remembers the password. Gated by
 * SETUP_SECRET — see the API route for why that is the right key.
 */
export default function RecuperarPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Acceso</p>
          <h1 className="mt-1 text-2xl font-bold">Recuperar mi acceso</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Si no recuerdas con qué correo o contraseña entrabas, aquí lo arreglas sin tocar la base de
            datos.
          </p>
        </div>

        <Card>
          <CardContent className="py-6">
            <RecoveryForm />
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted-foreground">
          ¿Ya te acordaste?{" "}
          <Link href="/admin/login" className="underline underline-offset-2">
            Entrar al panel
          </Link>
        </p>
      </div>
    </div>
  );
}
