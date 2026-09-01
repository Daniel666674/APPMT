"use client";

import { useTransition } from "react";
import { Loader2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { createMissingDemos } from "./actions";

/**
 * One click for the whole stock library. The presets already carry the
 * names, colors, services, prices, team and hours, so there is nothing to
 * type — the creator is for a client's real branding, not for these.
 */
export function FillLibraryButton({ missing }: { missing: number }) {
  const [pending, startTransition] = useTransition();

  if (missing === 0) return null;

  return (
    <Button
      type="button"
      variant="outline"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          try {
            const result = await createMissingDemos();
            toast.success(
              result.created === 1
                ? "Se creó 1 demo nueva"
                : `Se crearon ${result.created} demos nuevas`
            );
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "No pudimos crearlas");
          }
        })
      }
    >
      {pending ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Wand2 className="mr-1 h-4 w-4" />}
      {pending ? "Creando…" : `Crear las ${missing} demos que faltan`}
    </Button>
  );
}
