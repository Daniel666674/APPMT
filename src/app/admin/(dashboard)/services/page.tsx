import { requireBusinessSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServicesTable } from "./ServicesTable";

export default async function ServicesPage() {
  const { business, businessId } = await requireBusinessSession();
  const [services, staff] = await Promise.all([
    prisma.service.findMany({ where: { businessId }, orderBy: { sortOrder: "asc" }, include: { staff: true } }),
    prisma.staff.findMany({ where: { businessId, active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Servicios</h1>
        <p className="text-sm text-muted-foreground">Lo que tus clientes pueden reservar, cuánto dura y quién lo realiza.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Todos los servicios</CardTitle>
        </CardHeader>
        <CardContent>
          <ServicesTable
            currency={business.currency}
            staffOptions={staff.map((s) => ({ id: s.id, name: s.name }))}
            services={services.map((s) => ({
              id: s.id,
              name: s.name,
              description: s.description,
              durationMinutes: s.durationMinutes,
              price: s.price ? Number(s.price) : null,
              color: s.color,
              active: s.active,
              staffIds: s.staff.map((link) => link.staffId),
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
