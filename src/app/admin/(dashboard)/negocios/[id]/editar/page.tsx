import { notFound } from "next/navigation";
import { requirePlatformAdmin } from "@/lib/auth";
import { loadDemo } from "@/lib/demo-builder";
import { getIndustry } from "@/lib/industries";
import { prisma } from "@/lib/db";
import { DemoBuilder } from "@/components/demo/DemoBuilder";
import type { DemoBuilderInput } from "@/lib/validations";

export const dynamic = "force-dynamic";

/**
 * One screen that shapes an entire agenda: brand, copy, services, prices,
 * team, hours and booking rules, with a live preview beside it and a single
 * save. The five sections under /admin still exist for day-to-day work on a
 * real client; this is for shaping a demo while a lead is on the call.
 */
export default async function EditarDemoPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePlatformAdmin();
  const { id } = await params;

  const demo = await loadDemo(id);
  if (!demo) notFound();

  const prospects = await prisma.prospect.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true, company: true },
  });

  const b = demo.business;

  return (
    <DemoBuilder
      businessId={b.id}
      industryLabel={b.industryKey ? getIndustry(b.industryKey).label : null}
      meta={{
        createdAt: b.createdAt.toISOString(),
        updatedAt: b.updatedAt.toISOString(),
        views: demo.stats.views,
        bookings: demo.stats.bookings,
        lastViewedAt: demo.stats.lastViewedAt?.toISOString() ?? null,
        mixedSchedules: demo.hours.mixedSchedules,
      }}
      shares={demo.shares.map((s) => ({
        id: s.id,
        token: s.token,
        label: s.label,
        openCount: s.openCount,
        lastOpenedAt: s.lastOpenedAt?.toISOString() ?? null,
        createdAt: s.createdAt.toISOString(),
        prospectName: s.prospect ? s.prospect.company || s.prospect.name : null,
      }))}
      prospects={prospects.map((p) => ({
        id: p.id,
        label: p.company ? `${p.name} — ${p.company}` : p.name,
      }))}
      initial={{
        name: b.name,
        slug: b.slug,
        listed: b.listed,
        internalNotes: b.internalNotes ?? "",
        primaryColor: b.primaryColor,
        accentColor: b.accentColor,
        fontFamily: b.fontFamily as DemoBuilderInput["fontFamily"],
        cornerStyle: b.cornerStyle as DemoBuilderInput["cornerStyle"],
        themeMode: b.themeMode === "dark" ? "dark" : "light",
        logoUrl: b.logoUrl ?? "",
        faviconUrl: b.faviconUrl ?? "",
        heroImageUrl: b.heroImageUrl ?? "",
        heroHeadline: b.heroHeadline ?? "",
        heroSubheadline: b.heroSubheadline ?? "",
        aboutText: b.aboutText ?? "",
        contactEmail: b.contactEmail ?? "",
        contactPhone: b.contactPhone ?? "",
        whatsappNumber: b.whatsappNumber ?? "",
        address: b.address ?? "",
        city: b.city ?? "",
        website: b.website ?? "",
        instagramUrl: b.instagramUrl ?? "",
        facebookUrl: b.facebookUrl ?? "",
        bookingSlotIntervalMinutes: b.bookingSlotIntervalMinutes,
        bookingBufferMinutes: b.bookingBufferMinutes,
        minNoticeMinutes: b.minNoticeMinutes,
        maxAdvanceDays: b.maxAdvanceDays,
        requirePhone: b.requirePhone,
        cancellationWindowHours: b.cancellationWindowHours,
        services: demo.services.map((s) => ({
          id: s.id,
          name: s.name,
          description: s.description ?? "",
          durationMinutes: s.durationMinutes,
          price: s.price ? Number(s.price) : 0,
          color: s.color,
          active: s.active,
        })),
        staff: demo.staff.map((s) => ({
          id: s.id,
          name: s.name,
          bio: s.bio ?? "",
          avatarUrl: s.avatarUrl ?? "",
          color: s.color,
          active: s.active,
        })),
        openDays: demo.hours.openDays,
        openFromMinute: demo.hours.openFromMinute,
        openToMinute: demo.hours.openToMinute,
      }}
    />
  );
}
