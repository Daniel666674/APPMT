import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WeeklyAvailabilityEditor } from "@/components/admin/WeeklyAvailabilityEditor";
import { TimeOffManager } from "@/components/admin/TimeOffManager";

export default async function StaffAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const staff = await prisma.staff.findUnique({ where: { id } });
  if (!staff) notFound();

  const [availability, timeOffs] = await Promise.all([
    prisma.availability.findMany({ where: { staffId: id } }),
    prisma.timeOff.findMany({ where: { staffId: id, date: { gte: new Date() } }, orderBy: { date: "asc" } }),
  ]);

  const schedule: Record<number, { startMinute: number; endMinute: number }[]> = {};
  for (const a of availability) {
    schedule[a.dayOfWeek] = [...(schedule[a.dayOfWeek] ?? []), { startMinute: a.startMinute, endMinute: a.endMinute }];
  }
  for (const list of Object.values(schedule)) {
    list.sort((a, b) => a.startMinute - b.startMinute);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{staff.name}&apos;s availability</h1>
        <p className="text-sm text-muted-foreground">Set weekly working hours and add one-off time off.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Weekly hours</CardTitle>
          <CardDescription>Business-local time. Toggle a day off, or add multiple shifts (e.g. split lunch hours).</CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyAvailabilityEditor staffId={id} initialSchedule={schedule} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Time off</CardTitle>
          <CardDescription>Vacation days, sick days, or any date this person is unavailable.</CardDescription>
        </CardHeader>
        <CardContent>
          <TimeOffManager
            staffId={id}
            entries={timeOffs.map((t) => ({
              id: t.id,
              date: format(t.date, "yyyy-MM-dd"),
              allDay: t.allDay,
              startMinute: t.startMinute,
              endMinute: t.endMinute,
              reason: t.reason,
            }))}
          />
        </CardContent>
      </Card>
    </div>
  );
}
