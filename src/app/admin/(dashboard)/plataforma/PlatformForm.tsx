"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { updatePlatformSettings } from "./actions";

type Draft = {
  resellerName: string;
  resellerWhatsapp: string;
  publicDirectoryTitle: string;
  publicDirectorySubtitle: string;
  defaultCity: string;
  monthlyPrice: string;
  setupPrice: string;
};

export function PlatformForm({ initial }: { initial: Draft }) {
  const [draft, setDraft] = useState<Draft>(initial);
  const [pending, startTransition] = useTransition();

  function field<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function submit() {
    startTransition(async () => {
      try {
        await updatePlatformSettings({
          ...draft,
          monthlyPrice: draft.monthlyPrice === "" ? null : Number(draft.monthlyPrice),
          setupPrice: draft.setupPrice === "" ? null : Number(draft.setupPrice),
        });
        toast.success("Configuración guardada");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No pudimos guardar la configuración");
      }
    });
  }

  return (
    <section className="rounded-lg border border-border bg-card">
      <div className="border-b border-border px-5 py-3">
        <h2 className="text-base">Tu operación</h2>
        <p className="text-xs text-muted-foreground">
          Cómo te presentas cuando compartes una demo, y con qué precios haces las cuentas.
        </p>
      </div>

      <div className="grid gap-4 p-5 sm:grid-cols-2">
        <Field label="Tu nombre o el de tu agencia">
          <Input value={draft.resellerName} onChange={(e) => field("resellerName", e.target.value)} />
        </Field>
        <Field label="Tu WhatsApp">
          <Input
            value={draft.resellerWhatsapp}
            placeholder="3001234567"
            onChange={(e) => field("resellerWhatsapp", e.target.value)}
          />
        </Field>
        <Field label="Ciudad por defecto" hint="Se usa al crear una agenda nueva.">
          <Input value={draft.defaultCity} onChange={(e) => field("defaultCity", e.target.value)} />
        </Field>
        <Field label="Título del directorio público" hint="Lo que se ve en / cuando compartes la biblioteca.">
          <Input
            value={draft.publicDirectoryTitle}
            onChange={(e) => field("publicDirectoryTitle", e.target.value)}
          />
        </Field>
        <Field label="Subtítulo del directorio" full>
          <Textarea
            rows={2}
            value={draft.publicDirectorySubtitle}
            onChange={(e) => field("publicDirectorySubtitle", e.target.value)}
          />
        </Field>
        <Field label="Precio mensual (COP)" hint="Con esto se calcula el ingreso potencial.">
          <Input
            type="number"
            min={0}
            value={draft.monthlyPrice}
            onChange={(e) => field("monthlyPrice", e.target.value)}
          />
        </Field>
        <Field label="Precio de implementación (COP)">
          <Input
            type="number"
            min={0}
            value={draft.setupPrice}
            onChange={(e) => field("setupPrice", e.target.value)}
          />
        </Field>
      </div>

      <div className="flex justify-end border-t border-border px-5 py-3">
        <Button variant="brand" size="sm" onClick={submit} disabled={pending}>
          {pending ? "Guardando…" : "Guardar configuración"}
        </Button>
      </div>
    </section>
  );
}

function Field({
  label,
  hint,
  full,
  children,
}: {
  label: string;
  hint?: string;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={full ? "space-y-1.5 sm:col-span-2" : "space-y-1.5"}>
      <Label className="text-xs">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
