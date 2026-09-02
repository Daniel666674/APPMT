import { getAdminContext } from "@/lib/auth";
import { countBusinesses } from "@/lib/business";
import { prisma } from "@/lib/db";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, business, isPlatformAdmin } = await getAdminContext();
  const [agendaCount, prospectCount] = isPlatformAdmin
    ? await Promise.all([
        countBusinesses(),
        // Only the open ones: a badge counting closed-lost deals is noise.
        prisma.prospect.count({ where: { status: { notIn: ["GANADO", "PERDIDO"] } } }),
      ])
    : [0, 0];

  return (
    <AdminShell
      businessName={business?.name ?? null}
      businessSlug={business?.slug ?? null}
      logoUrl={business?.logoUrl}
      userName={session.name}
      isPlatformAdmin={isPlatformAdmin}
      agendaCount={agendaCount}
      prospectCount={prospectCount}
    >
      {children}
    </AdminShell>
  );
}
