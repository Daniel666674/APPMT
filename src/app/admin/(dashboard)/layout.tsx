import { requireBusinessSession } from "@/lib/auth";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { session, business } = await requireBusinessSession();

  return (
    <AdminShell
      businessName={business.name}
      businessSlug={business.slug}
      logoUrl={business.logoUrl}
      userName={session.name}
    >
      {children}
    </AdminShell>
  );
}
