import { requireBusinessSession } from "@/lib/auth";
import { countBusinesses } from "@/lib/business";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, business, isPlatformAdmin } = await requireBusinessSession();
  const agendaCount = isPlatformAdmin ? await countBusinesses() : 0;

  return (
    <AdminShell
      businessName={business.name}
      businessSlug={business.slug}
      logoUrl={business.logoUrl}
      userName={session.name}
      isPlatformAdmin={isPlatformAdmin}
      agendaCount={agendaCount}
    >
      {children}
    </AdminShell>
  );
}
