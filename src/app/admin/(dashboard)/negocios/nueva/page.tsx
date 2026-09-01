import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth";
import { INDUSTRIES } from "@/lib/industries";
import { AgendaCreator } from "@/components/creator/AgendaCreator";

export const dynamic = "force-dynamic";

export default async function NuevaAgendaPage() {
  await requirePlatformAdmin();

  return (
    <div className="space-y-5">
      <div>
        <Link
          href="/admin/negocios"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="h-4 w-4" /> Mis agendas
        </Link>
        <h1 className="mt-1 text-2xl font-bold">Nueva agenda</h1>
        <p className="text-sm text-muted-foreground">
          Vas viendo la página real mientras la armas. Al terminar te damos el enlace para compartirla.
        </p>
      </div>

      <AgendaCreator industries={INDUSTRIES} mode="admin" />
    </div>
  );
}
