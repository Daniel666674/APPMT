import { formatBusinessDate } from "@/lib/availability";
import { getBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q } = await searchParams;
  const business = await getBusiness();

  const customers = await prisma.customer.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { phone: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
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
        <h1 className="text-2xl font-bold">Customers</h1>
        <p className="text-sm text-muted-foreground">Everyone who has booked an appointment.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>All customers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form method="GET" className="max-w-sm">
            <Input name="q" defaultValue={q ?? ""} placeholder="Search by name, email, or phone…" />
          </form>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Visits</TableHead>
                <TableHead>Last booking</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                    No customers found.
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
