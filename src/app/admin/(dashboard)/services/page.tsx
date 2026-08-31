import { getBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ServicesTable } from "./ServicesTable";

export default async function ServicesPage() {
  const business = await getBusiness();
  const [services, staff] = await Promise.all([
    prisma.service.findMany({ orderBy: { sortOrder: "asc" }, include: { staff: true } }),
    prisma.staff.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Services</h1>
        <p className="text-sm text-muted-foreground">What customers can book, how long it takes, and who can perform it.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>All services</CardTitle>
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
