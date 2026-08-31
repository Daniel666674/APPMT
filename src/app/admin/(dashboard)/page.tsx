import Link from "next/link";
import { endOfDay, endOfWeek, startOfDay, startOfWeek } from "date-fns";
import { CalendarDays, TrendingUp, Users, Clock } from "lucide-react";
import { formatBusinessDate, formatBusinessTime } from "@/lib/availability";
import { getBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default async function AdminDashboardPage() {
  const business = await getBusiness();
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = startOfWeek(now);
  const weekEnd = endOfWeek(now);

  const [todayCount, weekCount, customerCount, upcoming] = await Promise.all([
    prisma.booking.count({
      where: { startsAt: { gte: todayStart, lte: todayEnd }, status: { in: ["CONFIRMED", "PENDING"] } },
    }),
    prisma.booking.count({
      where: { startsAt: { gte: weekStart, lte: weekEnd }, status: { in: ["CONFIRMED", "PENDING"] } },
    }),
    prisma.customer.count(),
    prisma.booking.findMany({
      where: { startsAt: { gte: now }, status: { in: ["CONFIRMED", "PENDING"] } },
      orderBy: { startsAt: "asc" },
      take: 6,
      include: { service: true, staff: true, customer: true },
    }),
  ]);

  const stats = [
    { label: "Today", value: todayCount, icon: CalendarDays },
    { label: "This week", value: weekCount, icon: TrendingUp },
    { label: "Total customers", value: customerCount, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">A quick look at what&apos;s coming up.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardContent className="flex items-center gap-4 py-5">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand/10 text-brand">
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-2xl font-bold leading-none">{s.value}</p>
                <p className="text-sm text-muted-foreground">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upcoming appointments</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          {upcoming.length === 0 ? (
            <p className="py-6 text-center text-sm text-muted-foreground">Nothing on the books yet.</p>
          ) : (
            upcoming.map((b) => (
              <div key={b.id} className="flex items-center gap-3 border-b border-border py-3 last:border-0">
                <Avatar name={b.staff.name} src={b.staff.avatarUrl} color={b.staff.color} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    {b.service.name} — {b.customer.name}
                  </p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="h-3 w-3" />
                    {formatBusinessDate(b.startsAt, business.timezone)} at {formatBusinessTime(b.startsAt, business.timezone)}
                  </p>
                </div>
                <Badge variant={b.status === "CONFIRMED" ? "success" : "warning"}>{b.status}</Badge>
              </div>
            ))
          )}
          <div className="pt-3">
            <Link href="/admin/appointments" className="text-sm font-medium text-brand hover:underline">
              View all appointments →
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
