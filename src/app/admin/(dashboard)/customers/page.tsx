import { formatBusinessDate } from "@/lib/availability";
import { requireBusinessSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const { business, businessId } = await requireBusinessSession();

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          businessId,
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : { businessId },
    orderBy: { createdAt: "desc" },
    include: {
      bookings: {
        orderBy: { startsAt: "desc" },
        take: 1,
        include: { service: true },
      },
      _count: { select: { bookings: true } },
    },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-sm text-muted-foreground">Todas las personas que han reservado una cita.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los clientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="GET" className="max-w-sm">
            <Input name="q" defaultValue={q ?? ""} placeholder="Buscar por nombre, correo o celular…" />
          </form>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Contacto</TableHead>
                <TableHead>Visitas</TableHead>
                <TableHead>Última cita</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    No encontramos clientes.
                  </TableCell>
                </TableRow>
              ) : (
                customers.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      <div>{c.email}</div>
                      {c.phone && <div>{c.phone}</div>}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{c._count.bookings}</Badge>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {c.bookings[0]
                        ? `${c.bookings[0].service.name} · ${formatBusinessDate(c.bookings[0].startsAt, business.timezone)}`
                        : "—"}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
