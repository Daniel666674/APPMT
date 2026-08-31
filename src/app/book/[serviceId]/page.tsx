import { notFound } from "next/navigation";
import { getBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/booking/SiteHeader";
import { SiteFooter } from "@/components/booking/SiteFooter";
import { BookingWizard } from "@/components/booking/BookingWizard";

export default async function BookServicePage({ params }: { params: Promise<{ serviceId: string }> }) {
  const { serviceId } = await params;
  const business = await getBusiness();

  const service = await prisma.service.findUnique({
    where: { id: serviceId },
    include: {
      staff: {
        where: { staff: { active: true } },
        include: { staff: true },
      },
    },
  });

  if (!service || !service.active) notFound();

  const staffOptions = service.staff
    .map((link) => link.staff)
    .sort((a, b) => a.sortOrder - b.sortOrder);

  if (staffOptions.length === 0) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader business={business} />
      <main className="flex-1">
        <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
          <BookingWizard
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
