import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
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
  if ((await prisma.user.count()) > 0) redirect("/admin/login");

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
