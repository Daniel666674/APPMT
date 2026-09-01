import { notFound } from "next/navigation";
import { format } from "date-fns";
import { requireBusinessSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { WeeklyAvailabilityEditor } from "@/components/admin/WeeklyAvailabilityEditor";
import { TimeOffManager } from "@/components/admin/TimeOffManager";

export default async function StaffAvailabilityPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const { businessId } = await requireBusinessSession();

  // Scoped: a staff id from another business must not resolve.
  const staff = await prisma.staff.findFirst({ where: { id, businessId } });
  if (!staff) notFound();

  const [availability, timeOffs] = await Promise.all([
    prisma.availability.findMany({ where: { staffId: id } }),
    prisma.timeOff.findMany({ where: { businessId, staffId: id, date: { gte: new Date() } }, orderBy: { date: "asc" } }),
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
        <h1 className="text-2xl font-bold">Horarios de {staff.name}</h1>
        <p className="text-sm text-muted-foreground">Define el horario semanal y agrega ausencias puntuales.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Horario semanal</CardTitle>
          <CardDescription>En la hora local del negocio. Apaga un día para cerrarlo o agrega varios turnos (por ejemplo, partido por almuerzo).</CardDescription>
        </CardHeader>
        <CardContent>
          <WeeklyAvailabilityEditor staffId={id} initialSchedule={schedule} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ausencias</CardTitle>
          <CardDescription>Vacaciones, incapacidades o cualquier día en que esta persona no atiende.</CardDescription>
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
