import { requirePlatformAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProspectBoard } from "./ProspectBoard";

export const dynamic = "force-dynamic";

/**
 * Who I am selling to, and which demo each one has. This is reseller data —
 * it is not a tenant's customer list (that lives per-agenda under
 * /admin/customers) and no business owner can ever reach it.
 */
export default async function ProspectosPage() {
  await requirePlatformAdmin();

  const [prospects, businesses] = await Promise.all([
    prisma.prospect.findMany({
      orderBy: [{ updatedAt: "desc" }],
      include: {
        business: { select: { id: true, name: true, slug: true, viewCount: true } },
        _count: { select: { shares: true } },
      },
    }),
    prisma.business.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true },
    }),
  ]);

  return (
    <ProspectBoard
      businesses={businesses}
      prospects={prospects.map((p) => ({
        id: p.id,
        name: p.name,
        company: p.company,
        email: p.email,
        phone: p.phone,
        city: p.city,
        sector: p.sector,
        status: p.status,
        source: p.source,
        value: p.value ? Number(p.value) : null,
        notes: p.notes,
        businessId: p.businessId,
        businessName: p.business?.name ?? null,
        businessSlug: p.business?.slug ?? null,
        demoViews: p.business?.viewCount ?? 0,
        shareCount: p._count.shares,
        nextFollowUpAt: p.nextFollowUpAt ? p.nextFollowUpAt.toISOString().slice(0, 10) : "",
        lastContactedAt: p.lastContactedAt?.toISOString() ?? null,
        createdAt: p.createdAt.toISOString(),
      }))}
    />
  );
}
