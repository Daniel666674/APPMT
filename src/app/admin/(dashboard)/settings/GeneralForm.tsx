"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { updateBusinessProfile } from "./actions";

interface Props {
  name: string;
  slug: string;
  listed: boolean;
  timezone: string;
  contactEmail: string;
  contactPhone: string;
  whatsappNumber: string;
  address: string;
  city: string;
  website: string;
  instagramUrl: string;
  facebookUrl: string;
  heroHeadline: string;
  heroSubheadline: string;
  aboutText: string;
  bookingSlotIntervalMinutes: number;
  bookingBufferMinutes: number;
  minNoticeMinutes: number;
  maxAdvanceDays: number;
  requirePhone: boolean;
  cancellationWindowHours: number;
}

const COMMON_TIMEZONES = [
  "America/Bogota",
  "America/Mexico_City",
  "America/Lima",
  "America/Santiago",
  "America/Argentina/Buenos_Aires",
  "America/Caracas",
  "America/Guayaquil",
  "America/Panama",
  "America/Santo_Domingo",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/Madrid",
  "UTC",
];

export function GeneralForm({ initial }: { initial: Props }) {
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
      await updateBusinessProfile(values);
      toast.success("Configuración guardada");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos guardar la configuración");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Datos del negocio</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="name">Nombre del negocio</Label>
            <Input id="name" value={values.name} onChange={(e) => set("name", e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="slug">Dirección web</Label>
            <div className="flex items-center gap-1">
              <span className="shrink-0 text-sm text-muted-foreground">/</span>
              <Input
                id="slug"
                value={values.slug}
                onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                required
                className="font-mono"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Tu página de reservas vive en{" "}
              <span className="font-mono">/{values.slug || "tu-negocio"}</span>. Si la cambias, los enlaces
              anteriores dejarán de funcionar.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="timezone">Zona horaria</Label>
            <select
              id="timezone"
              value={values.timezone}
              onChange={(e) => set("timezone", e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
            >
              {COMMON_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>
                  {tz}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactEmail">Correo de contacto</Label>
            <Input id="contactEmail" type="email" value={values.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactPhone">Teléfono de contacto</Label>
            <Input id="contactPhone" value={values.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="whatsappNumber">WhatsApp</Label>
            <Input
              id="whatsappNumber"
              value={values.whatsappNumber}
              onChange={(e) => set("whatsappNumber", e.target.value)}
              placeholder="300 123 4567"
            />
            <p className="text-xs text-muted-foreground">
              Pone un botón flotante en tu página de reservas. Déjalo vacío para quitarlo.
            </p>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="city">Ciudad</Label>
            <Input id="city" value={values.city} onChange={(e) => set("city", e.target.value)} placeholder="Bogotá" />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="address">Dirección</Label>
            <Input id="address" value={values.address} onChange={(e) => set("address", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="website">Sitio web</Label>
            <Input id="website" value={values.website} onChange={(e) => set("website", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instagramUrl">Instagram (URL)</Label>
            <Input id="instagramUrl" value={values.instagramUrl} onChange={(e) => set("instagramUrl", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="facebookUrl">Facebook (URL)</Label>
            <Input id="facebookUrl" value={values.facebookUrl} onChange={(e) => set("facebookUrl", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Textos de la página de reservas</h3>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="heroHeadline">Título principal</Label>
            <Input
              id="heroHeadline"
              value={values.heroHeadline}
              onChange={(e) => set("heroHeadline", e.target.value)}
              placeholder={`Agenda tu cita en ${values.name}`}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="heroSubheadline">Subtítulo</Label>
            <Input id="heroSubheadline" value={values.heroSubheadline} onChange={(e) => set("heroSubheadline", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="aboutText">Sección «Sobre nosotros»</Label>
            <Textarea id="aboutText" rows={4} value={values.aboutText} onChange={(e) => set("aboutText", e.target.value)} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Reglas de reserva</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="slotInterval">Intervalo entre horarios (minutos)</Label>
            <Input
              id="slotInterval"
              type="number"
              min={5}
              step={5}
              value={values.bookingSlotIntervalMinutes}
              onChange={(e) => set("bookingSlotIntervalMinutes", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="buffer">Descanso entre citas (minutos)</Label>
            <Input
              id="buffer"
              type="number"
              min={0}
              step={5}
              value={values.bookingBufferMinutes}
              onChange={(e) => set("bookingBufferMinutes", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="minNotice">Anticipación mínima (minutos)</Label>
            <Input
              id="minNotice"
              type="number"
              min={0}
              value={values.minNoticeMinutes}
              onChange={(e) => set("minNoticeMinutes", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="maxAdvance">Máximo de días de anticipación</Label>
            <Input
              id="maxAdvance"
              type="number"
              min={1}
              value={values.maxAdvanceDays}
              onChange={(e) => set("maxAdvanceDays", Number(e.target.value))}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="cancelWindow">Ventana de cancelación (horas)</Label>
            <Input
              id="cancelWindow"
              type="number"
              min={0}
              value={values.cancellationWindowHours}
              onChange={(e) => set("cancellationWindowHours", Number(e.target.value))}
            />
          </div>
          <div className="flex items-center gap-2 pt-6">
            <Switch checked={values.requirePhone} onCheckedChange={(v) => set("requirePhone", v)} />
            <Label>Pedir el celular al agendar</Label>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-sm font-semibold text-muted-foreground">Visibilidad</h3>
        <div className="flex items-start gap-3">
          <Switch checked={values.listed} onCheckedChange={(v) => set("listed", v)} />
          <div className="space-y-0.5">
            <Label>Aparecer en el directorio público</Label>
            <p className="text-xs text-muted-foreground">
              Apágalo si solo quieres que se llegue a tu agenda por el enlace directo. Tu página de reservas
              sigue funcionando igual; simplemente deja de listarse en la portada.
            </p>
          </div>
        </div>
      </section>

      <Button type="submit" variant="brand" disabled={saving}>
        {saving ? "Guardando…" : "Guardar cambios"}
      </Button>
    </form>
  );
}
