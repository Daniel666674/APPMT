"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronLeft, ChevronRight, Copy, Loader2, ExternalLink, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { IndustryPreset } from "@/lib/industries";
import { BRAND_PRESETS, CORNER_OPTIONS, FONT_OPTIONS } from "@/lib/theme";
import { slugify } from "@/lib/business";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BookingPreview } from "./BookingPreview";

const DAYS = [
  { value: 1, short: "L", label: "Lunes" },
  { value: 2, short: "M", label: "Martes" },
  { value: 3, short: "M", label: "Miércoles" },
  { value: 4, short: "J", label: "Jueves" },
  { value: 5, short: "V", label: "Viernes" },
  { value: 6, short: "S", label: "Sábado" },
  { value: 0, short: "D", label: "Domingo" },
];

const CITIES = [
  "Bogotá", "Medellín", "Cali", "Barranquilla", "Cartagena", "Bucaramanga",
  "Pereira", "Manizales", "Cúcuta", "Santa Marta", "Ibagué", "Villavicencio",
  "Armenia", "Neiva", "Pasto", "Montería", "Valledupar", "Popayán",
];

const STEPS = ["Sector", "Negocio", "Marca", "Horario", "Acceso"] as const;

function minutesToTime(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}
function timeToMinutes(v: string) {
  const [h, m] = v.split(":").map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

interface Props {
  industries: IndustryPreset[];
  /** "setup" asks for SETUP_SECRET; "admin" relies on the signed-in session. */
  mode: "setup" | "admin";
  /** In admin mode, a demo needs no login of its own. */
  defaultCreateOwnerUser?: boolean;
  /**
   * No account exists on this deployment yet, so this agenda has to create
   * the superadmin login — there is no "demo without a login" option until
   * somebody can actually sign in.
   */
  isFirstRun?: boolean;
}

export function AgendaCreator({
  industries,
  mode,
  defaultCreateOwnerUser = false,
  isFirstRun = false,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [created, setCreated] = useState<{ slug: string; businessName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [industryKey, setIndustryKey] = useState(industries[0]?.key ?? "peluqueria");
  const industry = useMemo(
    () => industries.find((i) => i.key === industryKey) ?? industries[0]!,
    [industries, industryKey]
  );

  const [businessName, setBusinessName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [city, setCity] = useState("Bogotá");
  const [address, setAddress] = useState("");
  const [contactPhone, setContactPhone] = useState("");
  const [whatsappNumber, setWhatsappNumber] = useState("");

  const [primaryColor, setPrimaryColor] = useState(industry.primaryColor);
  const [accentColor, setAccentColor] = useState(industry.accentColor);
  const [fontFamily, setFontFamily] = useState("inter");
  const [cornerStyle, setCornerStyle] = useState("soft");
  const [themeMode, setThemeMode] = useState("light");
  const [logoUrl, setLogoUrl] = useState("");
  const [heroImageUrl, setHeroImageUrl] = useState("");
  const [heroHeadline, setHeroHeadline] = useState("");
  const [heroSubheadline, setHeroSubheadline] = useState("");

  const [openDays, setOpenDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);
  const [openFrom, setOpenFrom] = useState(9 * 60);
  const [openTo, setOpenTo] = useState(18 * 60);
  const [staffNames, setStaffNames] = useState<string[]>([]);

  const [createOwnerUser, setCreateOwnerUser] = useState(isFirstRun || defaultCreateOwnerUser);
  const [ownerEmail, setOwnerEmail] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [listed, setListed] = useState(true);
  const [secret, setSecret] = useState("");

  /**
   * Picking a sector re-seeds the palette, but only while the colors are
   * still whatever the previous sector suggested — a colour the user chose
   * deliberately survives changing sector.
   */
  function chooseIndustry(key: string) {
    const next = industries.find((i) => i.key === key);
    if (!next) return;
    setIndustryKey(key);
    if (primaryColor === industry.primaryColor) setPrimaryColor(next.primaryColor);
    if (accentColor === industry.accentColor) setAccentColor(next.accentColor);
  }

  const effectiveSlug = slugTouched ? slugify(slug) : slugify(businessName);

  const [slugState, setSlugState] = useState<{ available: boolean; reason?: string } | null>(null);
  const [checkingSlug, setCheckingSlug] = useState(false);

  const checkSlug = useCallback(
    async (value: string, secretValue: string) => {
      if (value.length < 2) {
        setSlugState(null);
        return;
      }
      setCheckingSlug(true);
      try {
        const params = new URLSearchParams({ value });
        if (mode === "setup" && secretValue) params.set("secret", secretValue);
        const res = await fetch(`/api/agenda-slug?${params}`);
        if (!res.ok) {
          setSlugState(null);
          return;
        }
        setSlugState(await res.json());
      } catch {
        setSlugState(null);
      } finally {
        setCheckingSlug(false);
      }
    },
    [mode]
  );

  useEffect(() => {
    const value = effectiveSlug;
    const timer = setTimeout(() => void checkSlug(value, secret), 350);
    return () => clearTimeout(timer);
  }, [effectiveSlug, secret, checkSlug]);

  const previewName = businessName || industry.defaultBusinessName;
  const preview = {
    businessName: previewName,
    slug: effectiveSlug,
    heroHeadline: heroHeadline || industry.heroHeadline.replace(industry.defaultBusinessName, previewName),
    heroSubheadline:
      heroSubheadline || industry.heroSubheadline.replace(industry.defaultBusinessName, previewName),
    logoUrl,
    heroImageUrl,
    primaryColor,
    accentColor,
    fontFamily,
    cornerStyle,
    themeMode,
    whatsappNumber,
    contactPhone,
    services: industry.services,
  };

  const stepIssue = (() => {
    if (step === 1) {
      if (businessName.trim().length < 2) return "Escribe el nombre del negocio.";
      if (effectiveSlug.length < 2) return "La dirección web es muy corta.";
      if (slugState && !slugState.available) return `La dirección /${effectiveSlug} no sirve: ${slugState.reason}.`;
    }
    if (step === 3 && openDays.length === 0) return "Escoge al menos un día de atención.";
    if (step === 3 && openTo <= openFrom) return "La hora de cierre debe ser posterior a la de apertura.";
    if (step === 4) {
      if (mode === "setup" && !secret.trim()) return "Escribe la clave de instalación.";
      if (createOwnerUser && !ownerEmail.includes("@"))
        return isFirstRun ? "Escribe tu correo." : "Escribe el correo del cliente.";
      if (createOwnerUser && ownerPassword.length < 8) return "La contraseña debe tener mínimo 8 caracteres.";
    }
    return null;
  })();

  async function submit() {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/agendas", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          secret: mode === "setup" ? secret : undefined,
          agenda: {
            industryKey,
            businessName: businessName.trim(),
            slug: effectiveSlug,
            primaryColor,
            accentColor,
            fontFamily,
            cornerStyle,
            themeMode,
            logoUrl,
            heroImageUrl,
            heroHeadline,
            heroSubheadline,
            city,
            address,
            contactPhone,
            whatsappNumber,
            openDays,
            openFromMinute: openFrom,
            openToMinute: openTo,
            staffNames: staffNames.filter((n) => n.trim()),
            listed,
            createOwnerUser,
            ownerEmail: createOwnerUser ? ownerEmail : "",
            ownerPassword: createOwnerUser ? ownerPassword : "",
          },
        }),
      });
      const body = await res.json();
      if (!res.ok) {
        setError(body.error ?? "No pudimos crear la agenda.");
        return;
      }
      setCreated({ slug: body.slug, businessName: body.businessName });
      router.refresh();
    } catch {
      setError("No pudimos conectar con el servidor. Intenta de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  if (created) return <CreatedPanel created={created} mode={mode} />;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
      <div className="space-y-6">
        <Stepper step={step} onSelect={setStep} />

        {step === 0 ? (
          <Section
            title="¿A qué se dedica el negocio?"
            hint="Con esto llenamos los servicios, los precios y el equipo de ejemplo. Todo se puede cambiar después."
          >
            <div className="grid gap-2 sm:grid-cols-2">
              {industries.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => chooseIndustry(option.key)}
                  className={cn(
                    "flex items-center gap-3 rounded-lg border p-3 text-left transition",
                    option.key === industryKey
                      ? "border-brand bg-brand-soft ring-1 ring-brand"
                      : "border-border hover:border-brand/50"
                  )}
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                    style={{ background: option.primaryColor }}
                  >
                    {option.label.slice(0, 1)}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium">{option.label}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {option.services.length} servicios de ejemplo
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </Section>
        ) : null}

        {step === 1 ? (
          <Section title="Datos del negocio" hint="El nombre y la dirección web son lo que verá el cliente.">
            <Field label="Nombre del negocio">
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder={industry.defaultBusinessName}
                autoFocus
              />
            </Field>

            <Field label="Dirección web" hint="Este es el enlace que compartes y vendes.">
              <div className="flex items-center gap-1">
                <span className="shrink-0 text-sm text-muted-foreground">tusitio.com/</span>
                <Input
                  value={slugTouched ? slug : effectiveSlug}
                  onChange={(e) => {
                    setSlugTouched(true);
                    setSlug(e.target.value);
                  }}
                  className="font-mono"
                  placeholder="mi-negocio"
                />
              </div>
              <SlugStatus checking={checkingSlug} state={slugState} slug={effectiveSlug} />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Ciudad">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
                >
                  {CITIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </select>
              </Field>
              <Field label="Dirección" hint="Opcional.">
                <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Calle 93 #12-34" />
              </Field>
              <Field label="Teléfono fijo" hint="Opcional.">
                <Input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="(601) 123 4567" />
              </Field>
              <Field label="WhatsApp" hint="Pone un botón flotante en la página. Muy recomendado.">
                <Input
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="300 123 4567"
                />
              </Field>
            </div>
          </Section>
        ) : null}

        {step === 2 ? (
          <Section title="Identidad de marca" hint="Todo lo de aquí se ve en vivo a la derecha.">
            <Field label="Paletas listas">
              <div className="flex flex-wrap gap-2">
                {BRAND_PRESETS.map((preset) => {
                  const active = preset.primary === primaryColor && preset.accent === accentColor;
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      title={preset.name}
                      onClick={() => {
                        setPrimaryColor(preset.primary);
                        setAccentColor(preset.accent);
                      }}
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
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <ColorField label="Color principal" value={primaryColor} onChange={setPrimaryColor} />
              <ColorField label="Color de acento" value={accentColor} onChange={setAccentColor} />
            </div>

            <Field label="Tipografía">
              <div className="grid gap-2 sm:grid-cols-2">
                {FONT_OPTIONS.map((font) => (
                  <button
                    key={font.value}
                    type="button"
                    onClick={() => setFontFamily(font.value)}
                    className={cn(
                      "rounded-lg border px-3 py-2 text-left text-xs transition",
                      font.value === fontFamily ? "border-brand bg-brand-soft" : "border-border hover:border-brand/50"
                    )}
                  >
                    {font.label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Esquinas">
                <div className="flex gap-2">
                  {CORNER_OPTIONS.map((corner) => (
                    <button
                      key={corner.value}
                      type="button"
                      onClick={() => setCornerStyle(corner.value)}
                      className={cn(
                        "flex-1 border px-2 py-2 text-xs transition",
                        corner.value === cornerStyle ? "border-brand bg-brand-soft" : "border-border"
                      )}
                      style={{ borderRadius: corner.radius }}
                    >
                      {corner.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Modo">
                <div className="flex gap-2">
                  {[
                    { value: "light", label: "Claro" },
                    { value: "dark", label: "Oscuro" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setThemeMode(option.value)}
                      className={cn(
                        "flex-1 rounded-md border px-2 py-2 text-xs transition",
                        option.value === themeMode ? "border-brand bg-brand-soft" : "border-border"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Logo (enlace de imagen)" hint="Opcional. Si no hay, mostramos el nombre.">
                <Input value={logoUrl} onChange={(e) => setLogoUrl(e.target.value)} placeholder="https://…" />
              </Field>
              <Field label="Foto de portada" hint="Opcional. Se ve detrás del titular.">
                <Input value={heroImageUrl} onChange={(e) => setHeroImageUrl(e.target.value)} placeholder="https://…" />
              </Field>
            </div>

            <Field label="Titular de la página" hint="Déjalo vacío y usamos el del sector.">
              <Input
                value={heroHeadline}
                onChange={(e) => setHeroHeadline(e.target.value)}
                placeholder={industry.heroHeadline.replace(industry.defaultBusinessName, previewName)}
              />
            </Field>
            <Field label="Frase de apoyo">
              <Textarea
                value={heroSubheadline}
                onChange={(e) => setHeroSubheadline(e.target.value)}
                rows={2}
                placeholder={industry.heroSubheadline.replace(industry.defaultBusinessName, previewName)}
              />
            </Field>
          </Section>
        ) : null}

        {step === 3 ? (
          <Section title="Horario y equipo" hint="Es el horario de atención. Después puedes darle un horario distinto a cada persona.">
            <Field label="Días de atención">
              <div className="flex flex-wrap gap-2">
                {DAYS.map((day) => {
                  const on = openDays.includes(day.value);
                  return (
                    <button
                      key={day.value}
                      type="button"
                      title={day.label}
                      onClick={() =>
                        setOpenDays((prev) =>
                          prev.includes(day.value) ? prev.filter((d) => d !== day.value) : [...prev, day.value]
                        )
                      }
                      className={cn(
                        "h-10 w-10 rounded-full border text-sm font-medium transition",
                        on ? "border-brand bg-brand text-brand-foreground" : "border-border text-muted-foreground"
                      )}
                    >
                      {day.short}
                    </button>
                  );
                })}
              </div>
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Abre a las">
                <Input type="time" value={minutesToTime(openFrom)} onChange={(e) => setOpenFrom(timeToMinutes(e.target.value))} />
              </Field>
              <Field label="Cierra a las">
                <Input type="time" value={minutesToTime(openTo)} onChange={(e) => setOpenTo(timeToMinutes(e.target.value))} />
              </Field>
            </div>

            <Field
              label="Equipo"
              hint={`Déjalo vacío y creamos el equipo de ejemplo (${industry.staff.map((s) => s.name).join(", ")}).`}
            >
              <div className="space-y-2">
                {[0, 1, 2, 3].map((i) => (
                  <Input
                    key={i}
                    value={staffNames[i] ?? ""}
                    onChange={(e) =>
                      setStaffNames((prev) => {
                        const next = [...prev];
                        next[i] = e.target.value;
                        return next;
                      })
                    }
                    placeholder={industry.staff[i]?.name ?? `Persona ${i + 1}`}
                  />
                ))}
              </div>
            </Field>
          </Section>
        ) : null}

        {step === 4 ? (
          <Section
            title={isFirstRun ? "Tu cuenta de administrador" : "Acceso y publicación"}
            hint={
              isFirstRun
                ? "Este es el único usuario del despliegue: el tuyo. Con él entras a esta agenda y a todas las que crees después."
                : "Define si esta agenda es una demo tuya o la de un cliente."
            }
          >
            {isFirstRun ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Tu correo" hint="Con este correo vas a entrar al panel.">
                    <Input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} autoFocus />
                  </Field>
                  <Field label="Tu contraseña" hint="Mínimo 8 caracteres. Anótala.">
                    <Input type="text" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} />
                  </Field>
                </div>
                <p className="rounded-md border border-border bg-secondary/60 px-3 py-2 text-xs text-muted-foreground">
                  Las agendas que crees después no necesitan usuario: tus clientes potenciales solo abren
                  el enlace de la demo, sin registrarse ni entrar a nada.
                </p>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <Toggle
                    checked={!createOwnerUser}
                    onChange={(v) => setCreateOwnerUser(!v)}
                    title="Es una demo mía"
                    description="No crea ningún usuario. Quien la vea solo abre el enlace. La manejas desde tu misma cuenta, junto con todas las demás."
                  />
                  <Toggle
                    checked={createOwnerUser}
                    onChange={setCreateOwnerUser}
                    title="Es de un cliente que compró"
                    description="Crea un acceso propio para que el cliente entre solo a su agenda y no vea ninguna otra."
                  />
                </div>

                {createOwnerUser ? (
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field label="Correo del cliente">
                      <Input type="email" value={ownerEmail} onChange={(e) => setOwnerEmail(e.target.value)} />
                    </Field>
                    <Field label="Contraseña" hint="Mínimo 8 caracteres.">
                      <Input type="text" value={ownerPassword} onChange={(e) => setOwnerPassword(e.target.value)} />
                    </Field>
                  </div>
                ) : null}
              </>
            )}

            <Toggle
              checked={listed}
              onChange={setListed}
              title="Mostrar en la biblioteca de demos"
              description="La portada del sitio. Déjalo encendido para las demos que quieres mostrar y apágalo para la agenda de un cliente real."
            />

            {mode === "setup" ? (
              <Field label="Clave de instalación" hint="Es el valor de SETUP_SECRET en este despliegue.">
                <Input value={secret} onChange={(e) => setSecret(e.target.value)} className="font-mono" />
              </Field>
            ) : null}
          </Section>
        ) : null}

        {error ? (
          <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 border-t border-border pt-4">
          <Button type="button" variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            <ChevronLeft className="mr-1 h-4 w-4" /> Atrás
          </Button>

          <p className="hidden text-xs text-muted-foreground sm:block">{stepIssue}</p>

          {step < STEPS.length - 1 ? (
            <Button type="button" variant="brand" onClick={() => setStep((s) => s + 1)} disabled={Boolean(stepIssue)}>
              Siguiente <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button type="button" variant="brand" onClick={submit} disabled={Boolean(stepIssue) || saving}>
              {saving ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1 h-4 w-4" />}
              {saving ? "Creando…" : "Crear la agenda"}
            </Button>
          )}
        </div>
        {stepIssue ? <p className="text-xs text-muted-foreground sm:hidden">{stepIssue}</p> : null}
      </div>

      <aside className="lg:sticky lg:top-6 lg:self-start">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">Así lo verá el cliente</p>
        <BookingPreview data={preview} />
      </aside>
    </div>
  );
}

function Stepper({ step, onSelect }: { step: number; onSelect: (n: number) => void }) {
  return (
    <ol className="flex flex-wrap items-center gap-1.5">
      {STEPS.map((label, i) => (
        <li key={label}>
          <button
            type="button"
            onClick={() => onSelect(i)}
            disabled={i > step}
            className={cn(
              "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs transition",
              i === step
                ? "bg-brand text-brand-foreground"
                : i < step
                  ? "text-foreground hover:bg-secondary"
                  : "text-muted-foreground"
            )}
          >
            <span
              className={cn(
                "flex h-4 w-4 items-center justify-center rounded-full text-[10px]",
                i < step ? "bg-success/20 text-success" : i === step ? "bg-white/20" : "bg-secondary"
              )}
            >
              {i < step ? <Check className="h-2.5 w-2.5" /> : i + 1}
            </span>
            {label}
          </button>
        </li>
      ))}
    </ol>
  );
}

function Section({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <section className="space-y-4">
      <div>
        <h2 className="text-lg font-bold">{title}</h2>
        {hint ? <p className="mt-0.5 text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <Field label={label}>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-12 cursor-pointer rounded-md border border-input bg-background p-1"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} className="font-mono" />
      </div>
    </Field>
  );
}

function Toggle({
  checked,
  onChange,
  title,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  title: string;
  description: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-border p-3">
      <Switch checked={checked} onCheckedChange={onChange} />
      <span className="space-y-0.5">
        <span className="block text-sm font-medium">{title}</span>
        <span className="block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

function SlugStatus({
  checking,
  state,
  slug,
}: {
  checking: boolean;
  state: { available: boolean; reason?: string } | null;
  slug: string;
}) {
  if (slug.length < 2) return null;
  if (checking) return <p className="text-xs text-muted-foreground">Revisando…</p>;
  if (!state) return null;
  return state.available ? (
    <p className="flex items-center gap-1 text-xs text-success">
      <Check className="h-3 w-3" /> /{slug} está libre
    </p>
  ) : (
    <p className="text-xs text-destructive">/{slug} no sirve: {state.reason}</p>
  );
}

function CreatedPanel({
  created,
  mode,
}: {
  created: { slug: string; businessName: string };
  mode: "setup" | "admin";
}) {
  // Rendered after a click, so the browser is available — no effect needed.
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const url = `${origin}/${created.slug}`;

  return (
    <div className="mx-auto max-w-lg space-y-5 py-6 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
        <Check className="h-7 w-7" />
      </div>
      <div>
        <h2 className="text-xl font-bold">«{created.businessName}» ya está en línea</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Este es el enlace que compartes. Ábrelo desde el celular para mostrarlo tal como lo verá el cliente.
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-lg border border-border bg-secondary/50 p-2">
        <code className="flex-1 truncate px-1 text-left text-sm">{url}</code>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => {
            navigator.clipboard.writeText(url).then(
              () => toast.success("Enlace copiado"),
              () => toast.error("No pudimos copiar el enlace")
            );
          }}
        >
          <Copy className="mr-1 h-3.5 w-3.5" /> Copiar
        </Button>
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        <Button asChild variant="brand">
          <a href={`/${created.slug}`} target="_blank" rel="noreferrer">
            Ver la agenda <ExternalLink className="ml-1 h-4 w-4" />
          </a>
        </Button>
        <Button asChild variant="outline">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`Mira la agenda de ${created.businessName}: ${url}`)}`}
            target="_blank"
            rel="noreferrer"
          >
            Compartir por WhatsApp
          </a>
        </Button>
        <Button asChild variant="ghost">
          <a href={mode === "admin" ? "/admin/negocios" : "/"}>
            {mode === "admin" ? "Volver a mis agendas" : "Ver la biblioteca"}
          </a>
        </Button>
      </div>
    </div>
  );
}
