import { notFound, redirect } from "next/navigation";
import { getBusinessBySlug } from "@/lib/business";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent } from "@/components/ui/card";
import { LoginForm } from "@/app/admin/login/LoginForm";

export const dynamic = "force-dynamic";

export const metadata = { robots: { index: false, follow: false } };

/**
 * The business owner's door: /su-negocio/admin, right beside the booking
 * page they already know. One address per agenda, so a client never has to
 * remember a separate admin URL — theirs is their own link plus /admin.
 *
 * It signs into the same panel; what a client sees is scoped to their
 * agenda by the session, not by which page they came through.
 */
export default async function BusinessAdminLoginPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const business = await getBusinessBySlug(slug);
  if (!business) notFound();

  // Already signed in and this is their agenda — go straight in.
  const session = await getSession();
  if (session) {
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { businessId: true, isPlatformAdmin: true },
    });
    if (user?.isPlatformAdmin || user?.businessId === business.id) redirect("/admin");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/40 px-4 py-12">
      <div className="w-full max-w-sm space-y-4">
        <div className="text-center">
          <h1 className="text-xl font-bold">{business.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">Entra a administrar tu agenda.</p>
        </div>
        <Card>
          <CardContent className="py-6">
            <LoginForm next="/admin" />
          </CardContent>
        </Card>
        <p className="text-center text-xs text-muted-foreground">
          <a href={`/${business.slug}`} className="underline underline-offset-2">
            Ver la página de reservas
          </a>
        </p>
      </div>
    </div>
  );
}
