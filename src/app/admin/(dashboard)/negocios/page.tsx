import Link from "next/link";
import { Plus } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AgendaRow } from "./AgendaRow";

export const dynamic = "force-dynamic";

/**
 * The reseller's console: every agenda on the deployment, with a way into
 * each one. Entering an agenda points the session at it, so the rest of the
 * admin — citas, servicios, equipo, horarios, marca — edits that business
 * with no separate login.
 */
export default async function NegociosPage() {
  const session = await requirePlatformAdmin();

  const businesses = await prisma.business.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      logoUrl: true,
      primaryColor: true,
      accentColor: true,
      listed: true,
      city: true,
      createdAt: true,
      _count: { select: { services: true, staff: true, bookings: true, users: true } },
    },
  });

  const demos = businesses.filter((b) => b._count.users === 0);
  const clients = businesses.filter((b) => b._count.users > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Mis agendas</h1>
          <p className="text-sm text-muted-foreground">
            Todas las agendas de este despliegue. Entra en cualquiera para editar sus servicios, precios,
            equipo, horarios y marca — con esta misma cuenta.
          </p>
        </div>
        <Button asChild variant="brand">
          <Link href="/admin/negocios/nueva">
            <Plus className="mr-1 h-4 w-4" /> Nueva agenda
          </Link>
        </Button>
      </div>

      <Group
        title="Demos para vender"
        hint="No tienen usuario propio: las manejas desde tu cuenta. Cada una tiene su enlace para compartir."
        businesses={demos}
        activeId={session.businessId}
      />

      <Group
        title="Agendas de clientes"
        hint="Tienen su propio acceso. El cliente entra solo a la suya y no ve ninguna otra."
        businesses={clients}
        activeId={session.businessId}
      />
    </div>
  );
}

interface Row {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
  primaryColor: string;
  accentColor: string;
  listed: boolean;
  city: string | null;
  _count: { services: number; staff: number; bookings: number; users: number };
}

function Group({
  title,
  hint,
  businesses,
  activeId,
}: {
  title: string;
  hint: string;
  businesses: Row[];
  activeId: string;
}) {
  if (!businesses.length) return null;
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-sm font-semibold">
          {title} <span className="text-muted-foreground">({businesses.length})</span>
        </h2>
        <p className="text-xs text-muted-foreground">{hint}</p>
      </div>
      <Card>
        <CardContent className="divide-y divide-border p-0">
          {businesses.map((business) => (
            <AgendaRow
              key={business.id}
              business={{
                id: business.id,
                name: business.name,
                slug: business.slug,
                logoUrl: business.logoUrl,
                primaryColor: business.primaryColor,
                accentColor: business.accentColor,
                listed: business.listed,
                city: business.city,
                services: business._count.services,
                staff: business._count.staff,
                bookings: business._count.bookings,
                hasOwnLogin: business._count.users > 0,
              }}
              isActive={business.id === activeId}
            />
          ))}
        </CardContent>
      </Card>
    </section>
  );
}
