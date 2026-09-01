"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BRAND_PRESETS, CORNER_OPTIONS, FONT_OPTIONS } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { BookingPreview } from "@/components/creator/BookingPreview";
import { updateBranding } from "./actions";

interface Props {
  logoUrl: string;
  faviconUrl: string;
  heroImageUrl: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  cornerStyle: string;
  themeMode: "light" | "dark";
}

/** Enough of the business to render an honest preview beside the controls. */
interface Context {
  businessName: string;
  slug: string;
  heroHeadline: string;
  heroSubheadline: string;
  whatsappNumber: string;
  contactPhone: string;
  services: { name: string; description: string; durationMinutes: number; price: number }[];
}

export function BrandingForm({ initial, context }: { initial: Props; context: Context }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof Props>(key: K, value: Props[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateBranding(values);
      toast.success("Marca guardada. Tus clientes la verán al recargar.");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos guardar la marca");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-6">
        <div className="space-y-1.5">
          <Label>Paletas listas</Label>
          <div className="flex flex-wrap gap-2">
            {BRAND_PRESETS.map((preset) => {
              const active = preset.primary === values.primaryColor && preset.accent === values.accentColor;
              return (
                <button
                  key={preset.name}
                  type="button"
                  title={preset.name}
                  onClick={() =>
                    setValues((prev) => ({ ...prev, primaryColor: preset.primary, accentColor: preset.accent }))
                  }
                  className={cn(
                    "flex items-center gap-1.5 rounded-full border px-2 py-1.5 text-xs transition",
                    active ? "border-brand ring-1 ring-brand" : "border-border hover:border-brand/50"
                  )}
                >
                  <span className="flex">
                    <i className="block h-4 w-4 rounded-full" style={{ background: preset.primary }} />
                    <i className="-ml-1.5 block h-4 w-4 rounded-full" style={{ background: preset.accent }} />
                  </span>
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <ColorField label="Color principal" value={values.primaryColor} onChange={(v) => set("primaryColor", v)} />
          <ColorField label="Color de acento" value={values.accentColor} onChange={(v) => set("accentColor", v)} />
        </div>

        <div className="space-y-1.5">
          <Label>Tipografía</Label>
          <div className="grid gap-2 sm:grid-cols-2">
            {FONT_OPTIONS.map((font) => (
              <button
                key={font.value}
                type="button"
                onClick={() => set("fontFamily", font.value)}
                className={cn(
                  "rounded-lg border px-3 py-2 text-left text-xs transition",
                  font.value === values.fontFamily ? "border-brand bg-brand-soft" : "border-border hover:border-brand/50"
                )}
              >
                {font.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Esquinas</Label>
            <div className="flex gap-2">
              {CORNER_OPTIONS.map((corner) => (
                <button
                  key={corner.value}
                  type="button"
                  onClick={() => set("cornerStyle", corner.value)}
                  className={cn(
                    "flex-1 border px-2 py-2 text-xs transition",
                    corner.value === values.cornerStyle ? "border-brand bg-brand-soft" : "border-border"
                  )}
                  style={{ borderRadius: corner.radius }}
                >
                  {corner.label}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Modo de color</Label>
            <div className="flex gap-2">
              {[
                { value: "light", label: "Claro" },
                { value: "dark", label: "Oscuro" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => set("themeMode", option.value as Props["themeMode"])}
                  className={cn(
                    "flex-1 rounded-md border px-2 py-2 text-xs transition",
                    option.value === values.themeMode ? "border-brand bg-brand-soft" : "border-border"
                  )}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">Logo (enlace de imagen)</Label>
            <Input id="logoUrl" value={values.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="faviconUrl">Ícono del navegador</Label>
            <Input id="faviconUrl" value={values.faviconUrl} onChange={(e) => set("faviconUrl", e.target.value)} placeholder="https://…" />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="heroImageUrl">Foto de portada</Label>
          <Input
            id="heroImageUrl"
            value={values.heroImageUrl}
            onChange={(e) => set("heroImageUrl", e.target.value)}
            placeholder="https://…"
          />
          <p className="text-xs text-muted-foreground">
            Se ve detrás del titular, con el texto en blanco encima. Déjalo vacío para un fondo liso.
          </p>
        </div>

        <Button type="submit" variant="brand" disabled={saving}>
          {saving ? "Guardando…" : "Guardar marca"}
        </Button>
      </div>

      <div className="space-y-2 lg:sticky lg:top-6 lg:self-start">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Así lo verá tu cliente
        </p>
        <BookingPreview
          data={{
            businessName: context.businessName,
            slug: context.slug,
            heroHeadline: context.heroHeadline,
            heroSubheadline: context.heroSubheadline,
            logoUrl: values.logoUrl,
            heroImageUrl: values.heroImageUrl,
            primaryColor: values.primaryColor,
            accentColor: values.accentColor,
            fontFamily: values.fontFamily,
            cornerStyle: values.cornerStyle,
            themeMode: values.themeMode,
            whatsappNumber: context.whatsappNumber,
            contactPhone: context.contactPhone,
            services: context.services,
          }}
        />
      </div>
    </form>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
      </div>
    </div>
  );
}
