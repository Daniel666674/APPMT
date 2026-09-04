"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Copy, ExternalLink, LogIn, MoreVertical, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { deleteBusiness, switchBusiness, toggleBusinessListed } from "./actions";

export interface AgendaRowData {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  listed: boolean;
  city: string | null;
  services: number;
  staff: number;
  bookings: number;
  hasOwnLogin: boolean;
}

/** "1 cita" / "4 citas" — the count reads as a sentence, not a debug line. */
function plural(count: number, singular: string) {
  return `${count} ${singular}${count === 1 ? "" : "s"}`;
}

export function AgendaRow({ business, isActive }: { business: AgendaRowData; isActive: boolean }) {
  const [pending, startTransition] = useTransition();
  const [confirming, setConfirming] = useState(false);

  const shareUrl = typeof window === "undefined" ? `/${business.slug}` : `${window.location.origin}/${business.slug}`;

  function copyLink() {
    navigator.clipboard.writeText(shareUrl).then(
      () => toast.success("Enlace copiado"),
      () => toast.error("No pudimos copiar el enlace")
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-3 p-4">
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold text-white"
        style={{ background: `linear-gradient(135deg, ${business.primaryColor}, ${business.accentColor})` }}
      >
        {business.name.slice(0, 1).toUpperCase()}
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate font-medium">{business.name}</p>
          {isActive ? <Badge variant="success">Estás aquí</Badge> : null}
          {!business.listed ? <Badge variant="default">Oculta</Badge> : null}
          {business.hasOwnLogin ? <Badge variant="default">Acceso propio</Badge> : null}
        </div>
        <p className="truncate text-xs text-muted-foreground">
          <span className="font-mono">/{business.slug}</span>
          {business.city ? ` · ${business.city}` : ""} · {plural(business.services, "servicio")} ·{" "}
          {business.staff} en el equipo · {plural(business.bookings, "cita")}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <Button type="button" variant="outline" size="sm" onClick={copyLink}>
          <Copy className="mr-1 h-3.5 w-3.5" /> Enlace
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href={`/${business.slug}`} target="_blank" rel="noreferrer" aria-label={`Ver ${business.name}`}>
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </Button>
        <Button asChild variant="brand" size="sm">
          {/* The one screen that shapes this whole agenda — brand, servicios,
              equipo, horarios — with a live preview. */}
          <Link href={`/admin/negocios/${business.id}/editar`}>
            <Wand2 className="mr-1 h-3.5 w-3.5" /> Editar demo
          </Link>
        </Button>
        {isActive ? null : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={pending}
            onClick={() => startTransition(() => void switchBusiness(business.id))}
          >
            <LogIn className="mr-1 h-3.5 w-3.5" /> Entrar
          </Button>
        )}

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button" variant="ghost" size="sm" aria-label="Más acciones">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() =>
                startTransition(async () => {
                  try {
                    await toggleBusinessListed(business.id, !business.listed);
                    toast.success(business.listed ? "Oculta de la biblioteca" : "Visible en la biblioteca");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "No pudimos cambiarlo");
                  }
                })
              }
            >
              {business.listed ? "Ocultar de la biblioteca" : "Mostrar en la biblioteca"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={(e) => {
                e.preventDefault();
                if (!confirming) {
                  setConfirming(true);
                  toast.warning(`Vuelve a tocar "Eliminar" para borrar «${business.name}» y todas sus citas.`);
                  setTimeout(() => setConfirming(false), 5000);
                  return;
                }
                startTransition(async () => {
                  try {
                    await deleteBusiness(business.id);
                    toast.success("Agenda eliminada");
                  } catch (err) {
                    toast.error(err instanceof Error ? err.message : "No pudimos eliminarla");
                  }
                });
              }}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-3.5 w-3.5" />
              {confirming ? "Confirmar: eliminar" : "Eliminar"}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
