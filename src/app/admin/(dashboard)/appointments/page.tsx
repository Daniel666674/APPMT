import Link from "next/link";
import { addDays, format, subDays } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatBusinessTime } from "@/lib/availability";
import { requireBusinessSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { fromZonedTime } from "date-fns-tz";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { AppointmentStatusMenu } from "./AppointmentStatusMenu";
import { NewAppointmentDialog } from "./NewAppointmentDialog";

export default async function AppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const { date: dateParam } = await searchParams;
  const { business, businessId } = await requireBusinessSession();
  const date = dateParam && /^\d{4}-\d{2}-\d{2}$/.test(dateParam) ? dateParam : format(new Date(), "yyyy-MM-dd");

  const dayStart = fromZonedTime(`${date}T00:00:00`, business.timezone);
  const dayEnd = fromZonedTime(`${date}T23:59:59`, business.timezone);

  const [bookings, services, staff] = await Promise.all([
    prisma.booking.findMany({
      where: { businessId, startsAt: { gte: dayStart, lte: dayEnd } },
      orderBy: { startsAt: "asc" },
      include: { service: true, staff: true, customer: true },
    }),
    prisma.service.findMany({ where: { businessId, active: true }, include: { staff: true } }),
    prisma.staff.findMany({ where: { businessId, active: true } }),
  ]);

  const prevDate = format(subDays(new Date(`${date}T00:00:00`), 1), "yyyy-MM-dd");
  const nextDate = format(addDays(new Date(`${date}T00:00:00`), 1), "yyyy-MM-dd");
  const isToday = date === format(new Date(), "yyyy-MM-dd");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Citas</h1>
          <p className="text-sm text-muted-foreground">
            {format(new Date(`${date}T00:00:00`), "EEEE d 'de' MMMM 'de' yyyy", { locale: es })}
            {isToday && " · Hoy"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="icon">
            <Link href={`/admin/appointments?date=${prevDate}`} aria-label="Día anterior">
              <ChevronLeft className="h-4 w-4" />
            </Link>
          </Button>
          {!isToday && (
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/appointments">Hoy</Link>
            </Button>
          )}
          <Button asChild variant="outline" size="icon">
            <Link href={`/admin/appointments?date=${nextDate}`} aria-label="Día siguiente">
              <ChevronRight className="h-4 w-4" />
            </Link>
          </Button>
          <NewAppointmentDialog
            services={services.map((s) => ({ id: s.id, name: s.name, staffIds: s.staff.map((l) => l.staffId) }))}
            staff={staff.map((s) => ({ id: s.id, name: s.name }))}
          />
        </div>
      </div>

      <Card>
        <CardContent className="divide-y divide-border p-0">
          {bookings.length === 0 ? (
            <p className="py-10 text-center text-sm text-muted-foreground">No hay citas para este día.</p>
          ) : (
            bookings.map((b) => (
              <div key={b.id} className="flex flex-wrap items-center gap-4 px-6 py-4">
                <div className="w-20 shrink-0 text-sm font-medium">{formatBusinessTime(b.startsAt, business.timezone)}</div>
                <Avatar name={b.staff.name} src={b.staff.avatarUrl} color={b.staff.color} size={32} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{b.service.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {b.customer.name} · {b.staff.name}
                  </p>
                </div>
                <AppointmentStatusMenu id={b.id} status={b.status} />
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
