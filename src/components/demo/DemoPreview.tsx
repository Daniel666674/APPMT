"use client";

import { CalendarDays, Clock, MapPin, MessageCircle, User2 } from "lucide-react";
import { brandStyle } from "@/lib/theme";
import { cn, formatDuration, formatMoney, initials, minutesToTimeLabel } from "@/lib/utils";

export interface DemoPreviewData {
  name: string;
  slug: string;
  logoUrl: string;
  heroImageUrl: string;
  heroHeadline: string;
  heroSubheadline: string;
  aboutText: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  cornerStyle: string;
  themeMode: string;
  contactPhone: string;
  whatsappNumber: string;
  city: string;
  address: string;
  services: { name: string; description: string; durationMinutes: number; price: number; active: boolean }[];
  staff: { name: string; color: string; avatarUrl: string; active: boolean }[];
  openFromMinute: number;
  openToMinute: number;
}

/**
 * The lead's own booking page, rendered live beside the controls that shape
 * it. Selling this product is mostly showing someone their own name, colors
 * and prices on a working page, so the preview has to look like the page —
 * not like a settings summary.
 *
 * `console-escape` is what keeps the console's own dark/gold palette out of
 * it: inside that class the neutral tokens come back, and the business's
 * brand kit is layered on top exactly as it is on /<slug>.
 */
export function DemoPreview({ data, device }: { data: DemoPreviewData; device: "desktop" | "mobile" }) {
  const dark = data.themeMode === "dark";
  const services = data.services.filter((s) => s.active);
  const staff = data.staff.filter((s) => s.active);
  const mobile = device === "mobile";

  return (
    <div
      className={cn("console-escape", dark && "dark")}
      style={brandStyle({
        primaryColor: data.primaryColor,
        accentColor: data.accentColor,
        fontFamily: data.fontFamily,
        cornerStyle: data.cornerStyle,
      })}
    >
      <div
        className={cn(
          "mx-auto overflow-hidden rounded-xl border border-border bg-background font-sans text-foreground shadow-2xl transition-[max-width]",
          mobile ? "max-w-[380px]" : "max-w-none"
        )}
      >
        <header className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
          {data.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={data.logoUrl} alt="" className="h-7 w-auto object-contain" />
          ) : (
            <span className="truncate text-sm font-bold" style={{ color: "var(--brand-primary)" }}>
              {data.name || "Tu negocio"}
            </span>
          )}
          {!mobile ? (
            <nav className="flex items-center gap-4 text-[11px] text-muted-foreground">
              <span>Inicio</span>
              <span>Servicios</span>
              <span>Equipo</span>
              <span>Contacto</span>
            </nav>
          ) : null}
          <span
            className="shrink-0 rounded-md px-2.5 py-1.5 text-[11px] font-semibold"
            style={{ background: "var(--brand-primary)", color: "var(--brand-primary-foreground)" }}
          >
            Reservar cita
          </span>
        </header>

        <section className="relative px-5 py-10">
          {data.heroImageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={data.heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
              <div className="absolute inset-0 bg-black/60" />
            </>
          ) : null}

          <div className={cn("relative flex gap-6", mobile ? "flex-col" : "items-start")}>
            <div className={cn("min-w-0 flex-1", data.heroImageUrl && "text-white")}>
              <h1 className="text-2xl font-bold leading-tight">
                {data.heroHeadline || `Agenda tu cita en ${data.name || "tu negocio"}`}
              </h1>
              <p
                className={cn(
                  "mt-2 max-w-sm text-xs",
                  data.heroImageUrl ? "text-white/85" : "text-muted-foreground"
                )}
              >
                {data.heroSubheadline || "Escoge el servicio y la hora que más te sirva."}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <span
                  className="rounded-md px-3 py-2 text-[11px] font-semibold"
                  style={{ background: "var(--brand-primary)", color: "var(--brand-primary-foreground)" }}
                >
                  Reservar mi cita
                </span>
                <span
                  className="text-[11px] font-medium"
                  style={{ color: data.heroImageUrl ? "#fff" : "var(--brand-accent)" }}
                >
                  Ver servicios →
                </span>
              </div>
              {data.city || data.address ? (
                <p
                  className={cn(
                    "mt-4 flex items-center gap-1.5 text-[11px]",
                    data.heroImageUrl ? "text-white/75" : "text-muted-foreground"
                  )}
                >
                  <MapPin className="h-3 w-3" />
                  {[data.address, data.city].filter(Boolean).join(", ")}
                </p>
              ) : null}
            </div>

            {!mobile ? (
              <div className="w-56 shrink-0 rounded-lg border border-border bg-card p-3 shadow-lg">
                <p className="text-xs font-semibold">Reserva tu cita</p>
                <div className="mt-2.5 space-y-2.5">
                  <PreviewField icon={Clock} label="Servicio" value={services[0]?.name ?? "Seleccionar"} />
                  <PreviewField icon={User2} label="Profesional" value={staff[0]?.name ?? "Seleccionar"} />
                  <PreviewField icon={CalendarDays} label="Fecha" value="Seleccionar fecha" />
                  <PreviewField
                    icon={Clock}
                    label="Hora"
                    value={`${minutesToTimeLabel(data.openFromMinute)} – ${minutesToTimeLabel(data.openToMinute)}`}
                  />
                </div>
                <span
                  className="mt-3 block rounded-md py-1.5 text-center text-[11px] font-semibold"
                  style={{ background: "var(--brand-primary)", color: "var(--brand-primary-foreground)" }}
                >
                  Continuar
                </span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="border-t border-border px-4 py-6">
          <h2 className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
            Nuestros servicios
          </h2>
          {services.length === 0 ? (
            <p className="mt-4 text-center text-xs text-muted-foreground">
              Esta agenda no tiene servicios activos todavía.
            </p>
          ) : (
            <div className={cn("mt-4 grid gap-3", mobile ? "grid-cols-1" : "grid-cols-3")}>
              {services.slice(0, mobile ? 3 : 6).map((service, i) => (
                <div key={`${service.name}-${i}`} className="rounded-lg border border-border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-xs font-semibold">{service.name}</span>
                    <span className="shrink-0 text-xs font-semibold" style={{ color: "var(--brand-accent)" }}>
                      {formatMoney(service.price)}
                    </span>
                  </div>
                  <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground">{service.description}</p>
                  <div className="mt-2 flex items-center justify-between">
                    <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <Clock className="h-3 w-3" /> {formatDuration(service.durationMinutes)}
                    </span>
                    <span className="text-[11px] font-medium" style={{ color: "var(--brand-primary)" }}>
                      Reservar →
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {staff.length ? (
          <section className="border-t border-border px-4 py-6">
            <h2 className="text-center text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
              Nuestro equipo
            </h2>
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {staff.slice(0, 6).map((member, i) => (
                <div key={`${member.name}-${i}`} className="w-20 text-center">
                  {member.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={member.avatarUrl}
                      alt=""
                      className="mx-auto h-14 w-14 rounded-full object-cover"
                    />
                  ) : (
                    <span
                      className="mx-auto grid h-14 w-14 place-items-center rounded-full text-sm font-semibold text-white"
                      style={{ background: member.color }}
                    >
                      {initials(member.name)}
                    </span>
                  )}
                  <p className="mt-1.5 truncate text-[11px] font-medium">{member.name}</p>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {data.aboutText ? (
          <section className="border-t border-border px-6 py-6 text-center">
            <p className="mx-auto max-w-md text-[11px] leading-relaxed text-muted-foreground">
              {data.aboutText}
            </p>
          </section>
        ) : null}

        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-border px-4 py-3 text-[10px] text-muted-foreground">
          <span>
            © {new Date().getFullYear()} {data.name || "Tu negocio"}
          </span>
          {data.contactPhone ? <span>{data.contactPhone}</span> : null}
          {data.whatsappNumber ? (
            <span className="flex items-center gap-1 rounded-full bg-[#25D366] px-2 py-1 font-semibold text-white">
              <MessageCircle className="h-3 w-3" /> WhatsApp
            </span>
          ) : null}
        </footer>
      </div>
    </div>
  );
}

function PreviewField({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 leading-tight">
        <span className="block text-[9px] uppercase tracking-wide text-muted-foreground">{label}</span>
        <span className="block truncate text-[11px] font-medium">{value}</span>
      </span>
    </div>
  );
}
