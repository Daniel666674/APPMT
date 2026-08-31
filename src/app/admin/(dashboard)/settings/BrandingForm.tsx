"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { readableForeground } from "@/lib/theme";
import { updateBranding } from "./actions";

interface Props {
  logoUrl: string;
  faviconUrl: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: "inter" | "system" | "serif" | "mono";
  themeMode: "light" | "dark" | "auto";
}

const FONT_LABELS: Record<Props["fontFamily"], string> = {
  inter: "Inter (default)",
  system: "System UI",
  serif: "Serif",
  mono: "Monospace",
};

export function BrandingForm({ initial }: { initial: Props }) {
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
      toast.success("Branding saved — visitors will see it on next load");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save branding");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="logoUrl">Logo URL</Label>
            <Input id="logoUrl" value={values.logoUrl} onChange={(e) => set("logoUrl", e.target.value)} placeholder="https://…" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="faviconUrl">Favicon URL</Label>
            <Input id="faviconUrl" value={values.faviconUrl} onChange={(e) => set("faviconUrl", e.target.value)} placeholder="https://…" />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="primaryColor">Primary color</Label>
            <div className="flex items-center gap-2">
              <input
                id="primaryColor"
                type="color"
                value={values.primaryColor}
                onChange={(e) => set("primaryColor", e.target.value)}
                className="h-10 w-14 rounded border border-input bg-background"
              />
              <Input value={values.primaryColor} onChange={(e) => set("primaryColor", e.target.value)} className="font-mono" />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="accentColor">Accent color</Label>
            <div className="flex items-center gap-2">
              <input
                id="accentColor"
                type="color"
                value={values.accentColor}
                onChange={(e) => set("accentColor", e.target.value)}
                className="h-10 w-14 rounded border border-input bg-background"
              />
              <Input value={values.accentColor} onChange={(e) => set("accentColor", e.target.value)} className="font-mono" />
            </div>
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label>Font</Label>
            <Select value={values.fontFamily} onValueChange={(v) => set("fontFamily", v as Props["fontFamily"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(FONT_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Theme mode</Label>
            <Select value={values.themeMode} onValueChange={(v) => set("themeMode", v as Props["themeMode"])}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" variant="brand" disabled={saving}>
          {saving ? "Saving…" : "Save branding"}
        </Button>
      </div>

      <div className="space-y-3">
        <p className="text-sm font-medium">Live preview</p>
        <div className="overflow-hidden rounded-xl border border-border shadow-sm">
          <div className="px-4 py-3" style={{ backgroundColor: values.primaryColor }}>
            {values.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={values.logoUrl} alt="Logo" className="h-6 w-auto object-contain" />
            ) : (
              <span className="font-bold" style={{ color: readableForeground(values.primaryColor) }}>
                Your Business
              </span>
            )}
          </div>
          <div className="space-y-3 bg-background p-4">
            <p className="text-sm font-semibold">Choose a service</p>
            <div className="rounded-lg border border-border p-3">
              <p className="text-sm font-medium">Haircut</p>
              <p className="text-xs text-muted-foreground">30 min</p>
              <button
                type="button"
                className="mt-2 rounded-md px-3 py-1.5 text-xs font-semibold"
                style={{ backgroundColor: values.primaryColor, color: readableForeground(values.primaryColor) }}
              >
                Book
              </button>
            </div>
            <span
              className="inline-block rounded-full px-2.5 py-0.5 text-xs font-medium"
              style={{ backgroundColor: values.accentColor, color: readableForeground(values.accentColor) }}
            >
              Accent badge
            </span>
          </div>
        </div>
      </div>
    </form>
  );
}
