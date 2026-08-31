import { requireSession } from "@/lib/auth";
import { getBusiness } from "@/lib/business";
import { AdminShell } from "@/components/admin/AdminShell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();
  const business = await getBusiness();

  return (
    <AdminShell businessName={business.name} logoUrl={business.logoUrl} userName={session.name}>
      {children}
    </AdminShell>
  );
}
