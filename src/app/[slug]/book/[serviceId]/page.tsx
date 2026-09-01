import { notFound } from "next/navigation";
import { getBusinessBySlug } from "@/lib/business";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/booking/SiteHeader";
import { SiteFooter } from "@/components/booking/SiteFooter";
import { BookingWizard } from "@/components/booking/BookingWizard";

export const dynamic = "force-dynamic";

export default async function BookServicePage({
  params,
}: {
  params: Promise<{ slug: string; serviceId: string }>;
}) {
  const { slug, serviceId } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  // Scoped by businessId as well as id: a service id from another business
  // must not resolve here.
  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: business.id },
    include: {
      staff: {
        where: { staff: { active: true } },
        include: { staff: true },
      },
    },
  });

  if (!service || !service.active) notFound();

  const staffOptions = service.staff.map((link) => link.staff).sort((a, b) => a.sortOrder - b.sortOrder);
  if (staffOptions.length === 0) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader business={business} />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <BookingWizard
            slug={business.slug}
            business={{
              timezone: business.timezone,
              currency: business.currency,
              minNoticeMinutes: business.minNoticeMinutes,
              maxAdvanceDays: business.maxAdvanceDays,
              requirePhone: business.requirePhone,
            }}
            service={{
              id: service.id,
              name: service.name,
              description: service.description,
              durationMinutes: service.durationMinutes,
              price: service.price ? Number(service.price) : null,
            }}
            staffOptions={staffOptions.map((s) => ({
              id: s.id,
              name: s.name,
              avatarUrl: s.avatarUrl,
              color: s.color,
            }))}
          />
        </div>
      </main>
      <SiteFooter business={business} />
    </div>
  );
}
