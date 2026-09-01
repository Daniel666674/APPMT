"use client";

import { CalendarDays, Clock, MessageCircle } from "lucide-react";
import { brandStyle } from "@/lib/theme";
import { formatDuration, formatMoney } from "@/lib/utils";

export interface PreviewData {
  businessName: string;
  slug: string;
  heroHeadline: string;
  heroSubheadline: string;
  logoUrl: string;
  heroImageUrl: string;
  primaryColor: string;
  accentColor: string;
  fontFamily: string;
  cornerStyle: string;
  themeMode: string;
  whatsappNumber: string;
  contactPhone: string;
  services: { name: string; description: string; durationMinutes: number; price: number }[];
}

/**
 * A live miniature of the client's booking page, rendered with the same
 * brand variables the real page uses. Selling this product is mostly showing
 * someone their own colors on their own page, so the creator shows that
 * while the choice is still being made rather than after saving.
 */
export function BookingPreview({ data }: { data: PreviewData }) {
  const dark = data.themeMode === "dark";

  return (
    <div
      style={brandStyle({
        primaryColor: data.primaryColor,
        accentColor: data.accentColor,
        fontFamily: data.fontFamily,
        cornerStyle: data.cornerStyle,
      })}
      className={dark ? "dark" : undefined}
    >
      <div className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
        {/* Browser chrome, so it reads as a real page rather than a widget. */}
        <div className="flex items-center gap-2 border-b border-border bg-secondary/60 px-3 py-2">
          <span className="flex gap-1.5">
            <i className="block h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <i className="block h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
            <i className="block h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          </span>
          <span className="ml-1 truncate rounded bg-background px-2 py-0.5 font-mono text-[10px] text-muted-foreground">
            tusitio.com/{data.slug || "tu-negocio"}
          </span>
        </div>

        <div className="relative max-h-[520px] overflow-y-auto bg-background font-sans text-foreground">
          <header className="flex items-center justify-between border-b border-border px-4 py-3">
            {data.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.logoUrl} alt="" className="h-6 w-auto object-contain" />
            ) : (
              <span className="text-sm font-bold text-brand">{data.businessName || "Tu negocio"}</span>
            )}
            {data.contactPhone ? (
              <span className="text-[11px] text-muted-foreground">{data.contactPhone}</span>
            ) : null}
          </header>

          <section className="relative px-5 py-8 text-center">
            {data.heroImageUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={data.heroImageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div className="absolute inset-0 bg-black/55" />
              </>
            ) : null}
            <div className={data.heroImageUrl ? "relative text-white" : "relative"}>
              <h1 className="text-xl font-bold leading-tight">
                {data.heroHeadline || `Agenda tu cita en ${data.businessName || "tu negocio"}`}
              </h1>
              <p
                className={
                  data.heroImageUrl
                    ? "mt-1.5 text-xs text-white/85"
                    : "mt-1.5 text-xs text-muted-foreground"
                }
              >
                {data.heroSubheadline || "Escoge el servicio y la hora que más te sirva."}
              </p>
            </div>
          </section>

          <section className="space-y-2.5 px-4 pb-6">
            <p className="text-xs font-semibold">Escoge un servicio</p>
            {data.services.slice(0, 3).map((service) => (
              <div key={service.name} className="rounded-lg border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-semibold">{service.name}</span>
                  <span className="shrink-0 text-xs font-semibold">{formatMoney(service.price)}</span>
                </div>
                <p className="mt-0.5 line-clamp-1 text-[11px] text-muted-foreground">{service.description}</p>
                <div className="mt-2 flex items-center justify-between">
                  <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Clock className="h-3 w-3" /> {formatDuration(service.durationMinutes)}
                  </span>
                  <span
                    className="rounded-md px-2.5 py-1 text-[11px] font-medium"
                    style={{ background: "var(--brand-primary)", color: "var(--brand-primary-foreground)" }}
                  >
                    Reservar
                  </span>
                </div>
              </div>
            ))}

            <div className="rounded-lg border border-border bg-card p-3">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold">
                <CalendarDays className="h-3 w-3" style={{ color: "var(--brand-accent)" }} /> Escoge la hora
              </p>
              <div className="mt-2 grid grid-cols-4 gap-1.5">
                {["9:00 a. m.", "10:30 a. m.", "2:00 p. m.", "4:30 p. m."].map((slot, i) => (
                  <span
                    key={slot}
                    className="rounded-md border px-1 py-1 text-center text-[10px]"
                    style={
                      i === 1
                        ? {
                            background: "var(--brand-primary)",
                            color: "var(--brand-primary-foreground)",
                            borderColor: "var(--brand-primary)",
                          }
                        : { borderColor: "var(--border)" }
                    }
                  >
                    {slot}
                  </span>
                ))}
              </div>
            </div>
          </section>

          {data.whatsappNumber ? (
            <div className="pointer-events-none sticky bottom-3 flex justify-end px-4 pb-3">
              <span className="flex items-center gap-1.5 rounded-full bg-[#25D366] px-3 py-1.5 text-[11px] font-semibold text-white shadow-lg">
                <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
              </span>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
