import { requireBusinessSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StaffTable } from "./StaffTable";

export default async function StaffPage() {
  const { businessId } = await requireBusinessSession();
  const [staff, services] = await Promise.all([
    prisma.staff.findMany({ where: { businessId }, orderBy: { sortOrder: "asc" }, include: { services: true } }),
    prisma.service.findMany({ where: { businessId, active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Equipo</h1>
        <p className="text-sm text-muted-foreground">Administra quién presta los servicios y sus horarios de trabajo.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Miembros del equipo</CardTitle>
        </CardHeader>
        <CardContent>
          <StaffTable
            serviceOptions={services.map((s) => ({ id: s.id, name: s.name }))}
            staff={staff.map((s) => ({
              id: s.id,
              name: s.name,
              email: s.email,
              phone: s.phone,
              bio: s.bio,
              color: s.color,
              avatarUrl: s.avatarUrl,
              active: s.active,
              serviceIds: s.services.map((link) => link.serviceId),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
