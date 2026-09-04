import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Clock } from "lucide-react";
import { getBusinessBySlug } from "@/lib/business";
import { prisma } from "@/lib/db";
import { formatDuration, formatMoney } from "@/lib/utils";
import { SiteHeader } from "@/components/booking/SiteHeader";
import { SiteFooter } from "@/components/booking/SiteFooter";
import { WhatsAppButton } from "@/components/booking/WhatsAppButton";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

export default async function BusinessHomePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  const services = await prisma.service.findMany({
    where: { businessId: business.id, active: true },
    orderBy: { sortOrder: "asc" },
  });

  // Demo telemetry for the reseller console: how often this page gets opened
  // and when it was last looked at. Fire-and-forget and deliberately crude —
  // it counts page loads, not people — because a counter that fails must
  // never take the booking page down with it.
  void prisma.business
    .update({
      where: { id: business.id },
      data: { viewCount: { increment: 1 }, lastViewedAt: new Date() },
    })
    .catch(() => {});

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader business={business} />

      <main className="flex-1">
        <section className="relative">
          {business.heroImageUrl ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={business.heroImageUrl}
                alt=""
                className="absolute inset-0 h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-black/55" />
            </>
          ) : null}
          <div
            className={`relative mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24 ${
              business.heroImageUrl ? "text-white" : ""
            }`}
          >
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              {business.heroHeadline || `Agenda tu cita en ${business.name}`}
            </h1>
            {business.heroSubheadline ? (
              <p
                className={`mx-auto mt-4 max-w-2xl text-lg ${
                  business.heroImageUrl ? "text-white/85" : "text-muted-foreground"
                }`}
              >
                {business.heroSubheadline}
              </p>
            ) : null}
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
          <h2 className="mb-6 text-xl font-semibold">Escoge un servicio</h2>
          {services.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                Todavía no hay servicios publicados. Agrega uno desde el panel.
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {services.map((service) => (
                <Link key={service.id} href={`/${business.slug}/book/${service.id}`}>
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardContent className="flex h-full flex-col gap-3 p-6">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-semibold">{service.name}</h3>
                        {service.price !== null ? (
                          <span className="whitespace-nowrap font-semibold text-brand">
                            {formatMoney(Number(service.price), business.currency)}
                          </span>
                        ) : null}
                      </div>
                      {service.description ? (
                        <p className="line-clamp-2 text-sm text-muted-foreground">{service.description}</p>
                      ) : null}
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                          <Clock className="h-3.5 w-3.5" />
                          {formatDuration(service.durationMinutes)}
                        </span>
                        <Button variant="brand" size="sm">
                          Reservar <ArrowRight className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {business.aboutText ? (
          <section className="border-t border-border bg-secondary/40 py-16">
            <div className="mx-auto max-w-3xl px-4 text-center sm:px-6">
              <h2 className="mb-3 text-xl font-semibold">Sobre {business.name}</h2>
              <p className="whitespace-pre-line text-muted-foreground">{business.aboutText}</p>
            </div>
          </section>
        ) : null}
      </main>

      <SiteFooter business={business} />
      {business.whatsappNumber ? (
        <WhatsAppButton number={business.whatsappNumber} businessName={business.name} />
      ) : null}
    </div>
  );
}
