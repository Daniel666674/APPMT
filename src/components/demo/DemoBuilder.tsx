"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Check,
  Clock3,
  Copy,
  CopyPlus,
  Eye,
  ExternalLink,
  GripVertical,
  Link2,
  Monitor,
  Palette,
  Plus,
  RotateCcw,
  Scissors,
  Share2,
  Smartphone,
  Sparkles,
  Trash2,
  Type,
  UserSquare2,
  Save,
  SlidersHorizontal,
  StickyNote,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BRAND_PRESETS, CORNER_OPTIONS, FONT_OPTIONS } from "@/lib/theme";
import { cn, formatMoney, minutesToTimeLabel, WEEKDAY_LABELS } from "@/lib/utils";
import type { DemoBuilderInput } from "@/lib/validations";
import { DemoPreview } from "@/components/demo/DemoPreview";
import { ImageUploadField } from "@/components/admin/ImageUploadField";
import {
  clearBookingsAction,
  createShareAction,
  deleteShareAction,
  duplicateDemoAction,
  resetDemoAction,
  saveDemoAction,
  seedBookingsAction,
} from "@/app/admin/(dashboard)/negocios/[id]/editar/actions";

type Form = DemoBuilderInput;

export interface ShareRow {
  id: string;
  token: string;
  label: string | null;
  openCount: number;
  lastOpenedAt: string | null;
  createdAt: string;
  prospectName: string | null;
}

const SECTIONS = [
  { key: "marca", label: "Marca", icon: Palette },
  { key: "portada", label: "Portada y textos", icon: Type },
  { key: "servicios", label: "Servicios y precios", icon: Scissors },
  { key: "equipo", label: "Equipo", icon: UserSquare2 },
  { key: "horarios", label: "Horarios", icon: Clock3 },
  { key: "contacto", label: "Contacto", icon: Link2 },
  { key: "reglas", label: "Reglas de reserva", icon: SlidersHorizontal },
  { key: "notas", label: "Notas internas", icon: StickyNote },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

const SERVICE_COLORS = ["#7c3aed", "#d97706", "#0ea5e9", "#10b981", "#e11d48", "#6366f1"];

export function DemoBuilder({
  businessId,
  initial,
  meta,
  shares,
  prospects,
  industryLabel,
}: {
  businessId: string;
  initial: Form;
  meta: {
    createdAt: string;
    updatedAt: string;
    views: number;
    bookings: number;
    lastViewedAt: string | null;
    mixedSchedules: boolean;
  };
  shares: ShareRow[];
  prospects: { id: string; label: string }[];
  industryLabel: string | null;
}) {
  const [form, setForm] = useState<Form>(initial);
  const [saved, setSaved] = useState<Form>(initial);
  const [section, setSection] = useState<SectionKey>("marca");
  const [device, setDevice] = useState<"desktop" | "mobile">("desktop");
  const [pending, startTransition] = useTransition();

  const dirty = useMemo(() => JSON.stringify(form) !== JSON.stringify(saved), [form, saved]);

  function set<K extends keyof Form>(key: K, value: Form[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function save() {
    startTransition(async () => {
      try {
        await saveDemoAction(businessId, form);
        setSaved(form);
        toast.success("Demo guardada");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No pudimos guardar los cambios");
      }
    });
  }

  function run(fn: () => Promise<unknown>, ok: (result: never) => string) {
    startTransition(async () => {
      try {
        const result = await fn();
        toast.success(ok(result as never));
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No pudimos completar la acción");
      }
    });
  }

  const publicUrl = `/${saved.slug}`;

  return (
    <div className="-m-4 flex min-h-[calc(100vh-1px)] flex-col sm:-m-6 lg:-m-8">
      {/* ---------------------------------------------------------------- */}
      <header className="border-b border-border px-4 py-4 sm:px-6">
        <Link
          href="/admin/negocios"
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-brand"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Volver a demos
        </Link>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-2xl">{form.name || "Sin nombre"}</h1>
              <Badge variant={form.listed ? "success" : "outline"}>
                {form.listed ? "Visible" : "Oculta"}
              </Badge>
              {industryLabel ? <Badge variant="outline">{industryLabel}</Badge> : null}
              {dirty ? (
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-[11px] font-medium text-brand">
                  Cambios sin guardar
                </span>
              ) : null}
            </div>
            <Link
              href={publicUrl}
              target="_blank"
              className="mt-1 inline-flex items-center gap-1.5 text-sm text-brand hover:underline"
            >
              {publicUrl} <ExternalLink className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link href={publicUrl} target="_blank">
                <Eye className="h-3.5 w-3.5" /> Vista previa
              </Link>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                copy(`${window.location.origin}${publicUrl}`, "Enlace de la demo copiado")
              }
            >
              <Share2 className="h-3.5 w-3.5" /> Compartir demo
            </Button>
            <Button variant="brand" size="sm" onClick={save} disabled={pending || !dirty}>
              <Save className="h-3.5 w-3.5" />
              {pending ? "Guardando…" : dirty ? "Guardar cambios" : "Todo guardado"}
            </Button>
          </div>
        </div>
      </header>

      <Tabs defaultValue="constructor" className="flex min-h-0 flex-1 flex-col">
        <div className="border-b border-border px-4 sm:px-6">
          <TabsList className="my-3">
            <TabsTrigger value="constructor">Constructor</TabsTrigger>
            <TabsTrigger value="compartir">Compartir</TabsTrigger>
            <TabsTrigger value="acciones">Acciones rápidas</TabsTrigger>
          </TabsList>
        </div>

        {/* --------------------------- CONSTRUCTOR ------------------------ */}
        <TabsContent value="constructor" className="mt-0 flex-1">
          <div className="grid gap-4 p-4 sm:p-6 lg:grid-cols-[200px_minmax(0,1fr)_minmax(0,1.1fr)]">
            <nav className="space-y-1 lg:sticky lg:top-6 lg:self-start">
              <p className="px-2 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                Secciones
              </p>
              {SECTIONS.map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.key}
                    onClick={() => setSection(s.key)}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-md px-2.5 py-2 text-left text-sm transition-colors",
                      section === s.key
                        ? "bg-brand-soft font-medium text-brand"
                        : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    <span className="truncate">{s.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5">
              <SectionEditor
                section={section}
                form={form}
                set={set}
                setForm={setForm}
                mixedSchedules={meta.mixedSchedules}
                businessId={businessId}
              />
            </div>

            <div className="min-w-0 lg:sticky lg:top-6 lg:self-start">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
                  Vista previa en vivo
                </p>
                <div className="flex items-center gap-1 rounded-md border border-border p-0.5">
                  <button
                    onClick={() => setDevice("desktop")}
                    aria-label="Vista de escritorio"
                    className={cn(
                      "rounded p-1.5",
                      device === "desktop" ? "bg-brand-soft text-brand" : "text-muted-foreground"
                    )}
                  >
                    <Monitor className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={() => setDevice("mobile")}
                    aria-label="Vista móvil"
                    className={cn(
                      "rounded p-1.5",
                      device === "mobile" ? "bg-brand-soft text-brand" : "text-muted-foreground"
                    )}
                  >
                    <Smartphone className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
              <DemoPreview
                device={device}
                data={{
                  name: form.name,
                  slug: form.slug,
                  logoUrl: form.logoUrl ?? "",
                  heroImageUrl: form.heroImageUrl ?? "",
                  heroHeadline: form.heroHeadline ?? "",
                  heroSubheadline: form.heroSubheadline ?? "",
                  aboutText: form.aboutText ?? "",
                  primaryColor: form.primaryColor,
                  accentColor: form.accentColor,
                  fontFamily: form.fontFamily,
                  cornerStyle: form.cornerStyle,
                  themeMode: form.themeMode,
                  contactPhone: form.contactPhone ?? "",
                  whatsappNumber: form.whatsappNumber ?? "",
                  city: form.city ?? "",
                  address: form.address ?? "",
                  services: form.services.map((s) => ({ ...s, description: s.description ?? "" })),
                  staff: form.staff.map((s) => ({ ...s, avatarUrl: s.avatarUrl ?? "" })),
                  openFromMinute: form.openFromMinute,
                  openToMinute: form.openToMinute,
                }}
              />
            </div>
          </div>
        </TabsContent>

        {/* ---------------------------- COMPARTIR ------------------------- */}
        <TabsContent value="compartir" className="mt-0 flex-1 p-4 sm:p-6">
          <SharePanel
            businessId={businessId}
            slug={saved.slug}
            shares={shares}
            prospects={prospects}
            pending={pending}
            run={run}
          />
        </TabsContent>

        {/* ---------------------------- ACCIONES -------------------------- */}
        <TabsContent value="acciones" className="mt-0 flex-1 p-4 sm:p-6">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <ActionCard
              icon={Sparkles}
              title="Llenar la semana con citas"
              body="Reparte citas creíbles en los próximos 7 días, respetando los horarios de esta agenda. Una agenda vacía se ve muerta en una llamada."
              cta="Generar citas de muestra"
              disabled={pending}
              onClick={() =>
                run(
                  () => seedBookingsAction(businessId),
                  (r: { created: number }) => `${r.created} citas de muestra creadas`
                )
              }
            />
            <ActionCard
              icon={Trash2}
              title="Borrar las citas de prueba"
              body="Elimina todas las citas y clientes de esta agenda. Úsalo después de una demo para dejarla limpia."
              cta="Borrar citas y clientes"
              destructive
              confirm="Se borrarán todas las citas y clientes de esta agenda. ¿Seguir?"
              disabled={pending}
              onClick={() =>
                run(
                  () => clearBookingsAction(businessId),
                  (r: { removed: number }) => `${r.removed} citas borradas`
                )
              }
            />
            <ActionCard
              icon={RotateCcw}
              title="Restablecer al sector"
              body="Devuelve servicios, precios, equipo, horarios y colores a los del preset del sector. El nombre y la dirección web no se tocan."
              cta="Restablecer demo"
              confirm="Se reemplazarán servicios, equipo, horarios y colores por los del preset. ¿Seguir?"
              disabled={pending}
              onClick={() =>
                run(
                  () => resetDemoAction(businessId),
                  (r: { label: string }) => `Demo restablecida al preset «${r.label}»`
                )
              }
            />
            <ActionCard
              icon={CopyPlus}
              title="Duplicar esta demo"
              body="Crea una copia con su propia dirección web: misma marca, servicios, equipo y horarios, sin citas ni clientes. Para partir de una base y ajustarla a otro lead."
              cta="Duplicar"
              disabled={pending}
              onClick={() =>
                run(
                  () => duplicateDemoAction(businessId),
                  () => "Copia creada"
                )
              }
            />
          </div>
        </TabsContent>
      </Tabs>

      {/* ------------------------- STATUS BAR --------------------------- */}
      <footer className="mt-auto flex flex-wrap items-center gap-x-8 gap-y-2 border-t border-border px-4 py-3 text-xs text-muted-foreground sm:px-6">
        <Stat label="Estado" value={form.listed ? "Activa" : "Oculta"} />
        <Stat label="Creada" value={formatDate(meta.createdAt)} />
        <Stat label="Última edición" value={formatDate(meta.updatedAt)} />
        <Stat label="Visitas" value={String(meta.views)} />
        <Stat label="Reservas generadas" value={String(meta.bookings)} />
        <Stat
          label="Última vez abierta"
          value={meta.lastViewedAt ? formatDate(meta.lastViewedAt) : "Nunca"}
        />
      </footer>
    </div>
  );
}

/* ------------------------------------------------------------------ */

function SectionEditor({
  section,
  form,
  set,
  setForm,
  mixedSchedules,
  businessId,
}: {
  section: SectionKey;
  form: Form;
  set: <K extends keyof Form>(key: K, value: Form[K]) => void;
  setForm: React.Dispatch<React.SetStateAction<Form>>;
  mixedSchedules: boolean;
  businessId: string;
}) {
  switch (section) {
    case "marca":
      return (
        <div className="space-y-5">
          <Heading title="Marca" hint="Lo primero que ve el lead. Los presets son el atajo en una llamada." />

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Nombre del negocio">
              <Input value={form.name} onChange={(e) => set("name", e.target.value)} />
            </Field>
            <Field label="Dirección web" hint="Así queda: /barberia-los-compadres">
              <Input
                value={form.slug}
                onChange={(e) => set("slug", e.target.value.toLowerCase())}
                spellCheck={false}
              />
            </Field>
          </div>

          <div>
            <Label className="text-xs">Paletas listas</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {BRAND_PRESETS.map((preset) => {
                const active = form.primaryColor === preset.primary && form.accentColor === preset.accent;
                return (
                  <button
                    key={preset.name}
                    onClick={() => {
                      set("primaryColor", preset.primary);
                      set("accentColor", preset.accent);
                    }}
                    className={cn(
                      "flex items-center gap-2 rounded-md border px-2.5 py-1.5 text-xs transition-colors",
                      active ? "border-brand text-brand" : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <span className="flex">
                      <i className="block h-4 w-4 rounded-l" style={{ background: preset.primary }} />
                      <i className="block h-4 w-4 rounded-r" style={{ background: preset.accent }} />
                    </span>
                    {preset.name}
                    {active ? <Check className="h-3 w-3" /> : null}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <ColorField label="Color principal" value={form.primaryColor} onChange={(v) => set("primaryColor", v)} />
            <ColorField label="Color de acento" value={form.accentColor} onChange={(v) => set("accentColor", v)} />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Tipografía">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.fontFamily}
                onChange={(e) => set("fontFamily", e.target.value as Form["fontFamily"])}
              >
                {FONT_OPTIONS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Esquinas">
              <select
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                value={form.cornerStyle}
                onChange={(e) => set("cornerStyle", e.target.value as Form["cornerStyle"])}
              >
                {CORNER_OPTIONS.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
          </div>

          <ToggleRow
            label="Modo oscuro en la página del cliente"
            hint="Cambia el fondo de la página pública, no el de esta consola."
            checked={form.themeMode === "dark"}
            onChange={(v) => set("themeMode", v ? "dark" : "light")}
          />
          <ToggleRow
            label="Listar en el directorio público"
            hint="Apágalo para un cliente real que no debe aparecer junto a tus demos."
            checked={form.listed}
            onChange={(v) => set("listed", v)}
          />

          <div className="grid gap-3 sm:grid-cols-2">
            <ImageUploadField
              label="Logo"
              value={form.logoUrl ?? ""}
              onChange={(v) => set("logoUrl", v)}
              businessId={businessId}
            />
            <ImageUploadField
              label="Favicon"
              value={form.faviconUrl ?? ""}
              onChange={(v) => set("faviconUrl", v)}
              businessId={businessId}
              accept="image/png,image/x-icon,image/svg+xml"
            />
          </div>
        </div>
      );

    case "portada":
      return (
        <div className="space-y-5">
          <Heading title="Portada y textos" hint="El titular es lo que el lead lee primero. Que hable de su negocio." />
          <ImageUploadField
            label="Imagen de portada"
            value={form.heroImageUrl ?? ""}
            onChange={(v) => set("heroImageUrl", v)}
            businessId={businessId}
            aspect="wide"
          />
          <Field label="Titular">
            <Input
              value={form.heroHeadline ?? ""}
              onChange={(e) => set("heroHeadline", e.target.value)}
              placeholder={`Agenda tu cita en ${form.name}`}
            />
          </Field>
          <Field label="Subtítulo">
            <Input
              value={form.heroSubheadline ?? ""}
              onChange={(e) => set("heroSubheadline", e.target.value)}
              placeholder="Escoge el servicio y la hora que más te sirva."
            />
          </Field>
          <Field label="Sobre el negocio">
            <Textarea
              rows={5}
              value={form.aboutText ?? ""}
              onChange={(e) => set("aboutText", e.target.value)}
            />
          </Field>
        </div>
      );

    case "servicios":
      return (
        <div className="space-y-4">
          <Heading
            title="Servicios y precios"
            hint="Todo en pesos colombianos. Un servicio con citas no se borra: se desactiva."
          />
          <div className="space-y-3">
            {form.services.map((service, index) => (
              <div key={service.id || `nuevo-${index}`} className="rounded-md border border-border p-3">
                <div className="flex items-start gap-2">
                  <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/50" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="grid gap-2 sm:grid-cols-[minmax(0,2fr)_100px_120px]">
                      <Input
                        value={service.name}
                        placeholder="Nombre del servicio"
                        onChange={(e) => updateList(setForm, "services", index, { name: e.target.value })}
                      />
                      <Input
                        type="number"
                        min={5}
                        step={5}
                        value={service.durationMinutes}
                        onChange={(e) =>
                          updateList(setForm, "services", index, {
                            durationMinutes: Number(e.target.value),
                          })
                        }
                      />
                      <Input
                        type="number"
                        min={0}
                        step={1000}
                        value={service.price}
                        onChange={(e) =>
                          updateList(setForm, "services", index, { price: Number(e.target.value) })
                        }
                      />
                    </div>
                    <Input
                      value={service.description ?? ""}
                      placeholder="Descripción corta"
                      onChange={(e) =>
                        updateList(setForm, "services", index, { description: e.target.value })
                      }
                    />
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{formatMoney(service.price)}</span>
                      <span>·</span>
                      <span>{service.durationMinutes} min</span>
                      <label className="ml-auto flex items-center gap-2">
                        <Switch
                          checked={service.active}
                          onCheckedChange={(v) => updateList(setForm, "services", index, { active: v })}
                        />
                        Activo
                      </label>
                      <input
                        type="color"
                        value={service.color}
                        onChange={(e) => updateList(setForm, "services", index, { color: e.target.value })}
                        className="h-7 w-7 cursor-pointer rounded border border-border bg-transparent"
                        aria-label="Color del servicio"
                      />
                      <button
                        onClick={() => removeFromList(setForm, "services", index)}
                        className="text-destructive hover:underline"
                      >
                        Quitar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((f) => ({
                ...f,
                services: [
                  ...f.services,
                  {
                    id: "",
                    name: "",
                    description: "",
                    durationMinutes: 30,
                    price: 0,
                    color: SERVICE_COLORS[f.services.length % SERVICE_COLORS.length]!,
                    active: true,
                  },
                ],
              }))
            }
          >
            <Plus className="h-3.5 w-3.5" /> Agregar servicio
          </Button>
        </div>
      );

    case "equipo":
      return (
        <div className="space-y-4">
          <Heading
            title="Equipo"
            hint="En una demo todo el equipo atiende todos los servicios, para que la reserva nunca quede sin cupo."
          />
          <div className="space-y-3">
            {form.staff.map((member, index) => (
              <div key={member.id || `nuevo-${index}`} className="rounded-md border border-border p-3">
                <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                  <Input
                    value={member.name}
                    placeholder="Nombre"
                    onChange={(e) => updateList(setForm, "staff", index, { name: e.target.value })}
                  />
                  <Input
                    value={member.avatarUrl ?? ""}
                    placeholder="URL de la foto (opcional)"
                    onChange={(e) => updateList(setForm, "staff", index, { avatarUrl: e.target.value })}
                  />
                </div>
                <Input
                  className="mt-2"
                  value={member.bio ?? ""}
                  placeholder="Especialidad o descripción corta"
                  onChange={(e) => updateList(setForm, "staff", index, { bio: e.target.value })}
                />
                <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                  <label className="flex items-center gap-2">
                    <Switch
                      checked={member.active}
                      onCheckedChange={(v) => updateList(setForm, "staff", index, { active: v })}
                    />
                    Activo
                  </label>
                  <input
                    type="color"
                    value={member.color}
                    onChange={(e) => updateList(setForm, "staff", index, { color: e.target.value })}
                    className="h-7 w-7 cursor-pointer rounded border border-border bg-transparent"
                    aria-label="Color"
                  />
                  {form.staff.length > 1 ? (
                    <button
                      onClick={() => removeFromList(setForm, "staff", index)}
                      className="ml-auto text-destructive hover:underline"
                    >
                      Quitar
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setForm((f) => ({
                ...f,
                staff: [
                  ...f.staff,
                  {
                    id: "",
                    name: "",
                    bio: "",
                    avatarUrl: "",
                    color: SERVICE_COLORS[f.staff.length % SERVICE_COLORS.length]!,
                    active: true,
                  },
                ],
              }))
            }
          >
            <Plus className="h-3.5 w-3.5" /> Agregar persona
          </Button>
        </div>
      );

    case "horarios":
      return (
        <div className="space-y-5">
          <Heading
            title="Horarios"
            hint="Un solo horario para toda la agenda. Para un cliente real con horarios distintos por persona, usa el editor de Equipo."
          />
          {mixedSchedules ? (
            <p className="rounded-md border border-border bg-brand-soft px-3 py-2 text-xs text-brand">
              Esta agenda tiene horarios distintos por persona. Si guardas desde aquí, todos quedarán con
              el mismo horario.
            </p>
          ) : null}

          <div>
            <Label className="text-xs">Días de atención</Label>
            <div className="mt-2 flex flex-wrap gap-2">
              {WEEKDAY_LABELS.map((label, day) => {
                const on = form.openDays.includes(day);
                return (
                  <button
                    key={label}
                    onClick={() =>
                      set(
                        "openDays",
                        on ? form.openDays.filter((d) => d !== day) : [...form.openDays, day].sort()
                      )
                    }
                    className={cn(
                      "rounded-md border px-3 py-1.5 text-xs transition-colors",
                      on ? "border-brand bg-brand-soft text-brand" : "border-border text-muted-foreground"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Abre a las" hint={minutesToTimeLabel(form.openFromMinute)}>
              <Input
                type="time"
                value={minutesToInput(form.openFromMinute)}
                onChange={(e) => set("openFromMinute", inputToMinutes(e.target.value))}
              />
            </Field>
            <Field label="Cierra a las" hint={minutesToTimeLabel(form.openToMinute)}>
              <Input
                type="time"
                value={minutesToInput(form.openToMinute)}
                onChange={(e) => set("openToMinute", inputToMinutes(e.target.value))}
              />
            </Field>
          </div>
        </div>
      );

    case "contacto":
      return (
        <div className="space-y-4">
          <Heading title="Contacto" hint="El WhatsApp aparece como botón flotante en la página del cliente." />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="WhatsApp">
              <Input
                value={form.whatsappNumber ?? ""}
                placeholder="3001234567"
                onChange={(e) => set("whatsappNumber", e.target.value)}
              />
            </Field>
            <Field label="Teléfono">
              <Input value={form.contactPhone ?? ""} onChange={(e) => set("contactPhone", e.target.value)} />
            </Field>
            <Field label="Correo de contacto">
              <Input value={form.contactEmail ?? ""} onChange={(e) => set("contactEmail", e.target.value)} />
            </Field>
            <Field label="Ciudad">
              <Input value={form.city ?? ""} onChange={(e) => set("city", e.target.value)} />
            </Field>
            <Field label="Dirección">
              <Input value={form.address ?? ""} onChange={(e) => set("address", e.target.value)} />
            </Field>
            <Field label="Sitio web">
              <Input value={form.website ?? ""} onChange={(e) => set("website", e.target.value)} />
            </Field>
            <Field label="Instagram">
              <Input value={form.instagramUrl ?? ""} onChange={(e) => set("instagramUrl", e.target.value)} />
            </Field>
            <Field label="Facebook">
              <Input value={form.facebookUrl ?? ""} onChange={(e) => set("facebookUrl", e.target.value)} />
            </Field>
          </div>
        </div>
      );

    case "reglas":
      return (
        <div className="space-y-4">
          <Heading title="Reglas de reserva" hint="Cómo se comporta la agenda cuando alguien reserva." />
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Intervalo entre cupos (min)">
              <Input
                type="number"
                min={5}
                max={120}
                step={5}
                value={form.bookingSlotIntervalMinutes}
                onChange={(e) => set("bookingSlotIntervalMinutes", Number(e.target.value))}
              />
            </Field>
            <Field label="Colchón entre citas (min)">
              <Input
                type="number"
                min={0}
                max={120}
                step={5}
                value={form.bookingBufferMinutes}
                onChange={(e) => set("bookingBufferMinutes", Number(e.target.value))}
              />
            </Field>
            <Field label="Aviso mínimo (min)">
              <Input
                type="number"
                min={0}
                value={form.minNoticeMinutes}
                onChange={(e) => set("minNoticeMinutes", Number(e.target.value))}
              />
            </Field>
            <Field label="Se puede reservar con (días) de anticipación">
              <Input
                type="number"
                min={1}
                max={365}
                value={form.maxAdvanceDays}
                onChange={(e) => set("maxAdvanceDays", Number(e.target.value))}
              />
            </Field>
            <Field label="Ventana para cancelar (horas)">
              <Input
                type="number"
                min={0}
                value={form.cancellationWindowHours}
                onChange={(e) => set("cancellationWindowHours", Number(e.target.value))}
              />
            </Field>
          </div>
          <ToggleRow
            label="Pedir teléfono al reservar"
            checked={form.requirePhone}
            onChange={(v) => set("requirePhone", v)}
          />
        </div>
      );

    case "notas":
      return (
        <div className="space-y-4">
          <Heading
            title="Notas internas"
            hint="Solo tú ves esto. Nunca aparece en la página del cliente."
          />
          <Textarea
            rows={12}
            value={form.internalNotes ?? ""}
            placeholder="Qué dijo el lead, qué falta ajustar, con quién quedó esta demo…"
            onChange={(e) => set("internalNotes", e.target.value)}
          />
        </div>
      );
  }
}

/* ------------------------------------------------------------------ */

function SharePanel({
  businessId,
  slug,
  shares,
  prospects,
  pending,
  run,
}: {
  businessId: string;
  slug: string;
  shares: ShareRow[];
  prospects: { id: string; label: string }[];
  pending: boolean;
  run: (fn: () => Promise<unknown>, ok: (r: never) => string) => void;
}) {
  const [label, setLabel] = useState("");
  const [prospectId, setProspectId] = useState("");

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <div className="space-y-4 rounded-lg border border-border bg-card p-5">
        <Heading
          title="Enlaces con seguimiento"
          hint="Cada enlace es propio, así sabes quién abrió la demo y cuándo. El enlace directo /… sigue funcionando."
        />
        <Field label="Para quién es este enlace">
          <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ej: llamada con Andrés" />
        </Field>
        <Field label="Prospecto (opcional)">
          <select
            className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={prospectId}
            onChange={(e) => setProspectId(e.target.value)}
          >
            <option value="">Sin asignar</option>
            {prospects.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </Field>
        <Button
          variant="brand"
          size="sm"
          disabled={pending}
          onClick={() =>
            run(
              () => createShareAction(businessId, { label, prospectId }),
              (r: { token: string }) => {
                copy(`${window.location.origin}/s/${r.token}`, "Enlace creado y copiado");
                setLabel("");
                setProspectId("");
                return "Enlace creado";
              }
            )
          }
        >
          <Plus className="h-3.5 w-3.5" /> Crear enlace
        </Button>
      </div>

      <div className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-base">Enlaces compartidos</h2>
        </div>
        {shares.length === 0 ? (
          <p className="px-5 py-8 text-center text-sm text-muted-foreground">
            Todavía no has creado enlaces con seguimiento para esta demo.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {shares.map((share) => (
              <li key={share.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {share.label || share.prospectName || "Enlace sin nombre"}
                  </p>
                  <p className="truncate font-mono text-[11px] text-muted-foreground">/s/{share.token}</p>
                </div>
                <span className="text-xs text-muted-foreground">
                  {share.openCount} {share.openCount === 1 ? "apertura" : "aperturas"}
                  {share.lastOpenedAt ? ` · ${formatDate(share.lastOpenedAt)}` : ""}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copy(`${window.location.origin}/s/${share.token}`, "Enlace copiado")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() =>
                    run(
                      () => deleteShareAction(businessId, share.id),
                      () => "Enlace eliminado"
                    )
                  }
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
        <p className="border-t border-border px-5 py-3 text-xs text-muted-foreground">
          Enlace directo: <span className="font-mono">/{slug}</span>
        </p>
      </div>
    </div>
  );
}

/* ---------------------------- small parts --------------------------- */

function ActionCard({
  icon: Icon,
  title,
  body,
  cta,
  onClick,
  disabled,
  destructive,
  confirm,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
  cta: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
  confirm?: string;
}) {
  return (
    <div className="flex flex-col rounded-lg border border-border bg-card p-5">
      <Icon className={cn("h-5 w-5", destructive ? "text-destructive" : "text-brand")} />
      <h3 className="mt-3 text-base">{title}</h3>
      <p className="mt-1 flex-1 text-xs leading-relaxed text-muted-foreground">{body}</p>
      <Button
        className="mt-4"
        size="sm"
        variant={destructive ? "destructive" : "outline"}
        disabled={disabled}
        onClick={() => {
          if (confirm && !window.confirm(confirm)) return;
          onClick();
        }}
      >
        {cta}
      </Button>
    </div>
  );
}

function Heading({ title, hint }: { title: string; hint?: string }) {
  return (
    <div>
      <h2 className="text-lg">{title}</h2>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {children}
      {hint ? <p className="text-[11px] text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ColorField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <Input value={value} onChange={(e) => onChange(e.target.value)} spellCheck={false} />
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-md border border-border bg-transparent"
          aria-label={label}
        />
      </div>
    </Field>
  );
}



function ToggleRow({
  label,
  hint,
  checked,
  onChange,
}: {
  label: string;
  hint?: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-md border border-border px-3 py-2.5">
      <span className="min-w-0">
        <span className="block text-sm">{label}</span>
        {hint ? <span className="mt-0.5 block text-[11px] text-muted-foreground">{hint}</span> : null}
      </span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <span className="leading-tight">
      <span className="block text-[10px] uppercase tracking-wide text-muted-foreground/70">{label}</span>
      <span className="block text-xs font-medium text-foreground">{value}</span>
    </span>
  );
}

/* ------------------------------- helpers ---------------------------- */

function updateList<K extends "services" | "staff">(
  setForm: React.Dispatch<React.SetStateAction<Form>>,
  key: K,
  index: number,
  patch: Partial<Form[K][number]>
) {
  setForm((f) => {
    const next = [...f[key]];
    next[index] = { ...next[index]!, ...patch } as Form[K][number];
    return { ...f, [key]: next };
  });
}

function removeFromList(
  setForm: React.Dispatch<React.SetStateAction<Form>>,
  key: "services" | "staff",
  index: number
) {
  setForm((f) => ({ ...f, [key]: f[key].filter((_, i) => i !== index) }));
}

function minutesToInput(minutes: number) {
  return `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}`;
}

function inputToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "America/Bogota",
  }).format(new Date(iso));
}

function copy(text: string, message: string) {
  navigator.clipboard.writeText(text).then(
    () => toast.success(message),
    () => toast.error("No pudimos copiar el enlace")
  );
}
