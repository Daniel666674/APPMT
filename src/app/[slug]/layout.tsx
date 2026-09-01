import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getBusinessBySlug } from "@/lib/business";
import { brandStyle } from "@/lib/theme";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) return { title: "Negocio no encontrado" };
  return {
    title: `${business.name} — Agenda tu cita`,
    description: business.heroSubheadline ?? `Reserva tu próxima cita en ${business.name} por internet.`,
    icons: business.faviconUrl ? [{ url: business.faviconUrl }] : undefined,
  };
}

/**
 * Applies this business's brand kit to its own pages. Branding lives here
 * rather than in the root layout because each business on this deployment
 * has its own colors and fonts.
 */
export default async function BusinessLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  return (
    <div
      style={brandStyle(business)}
      className={business.themeMode === "dark" ? "dark bg-background text-foreground" : undefined}
    >
      {children}
    </div>
  );
}
