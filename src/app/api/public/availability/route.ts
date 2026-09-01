import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots, formatBusinessTime } from "@/lib/availability";
import { getBusinessBySlug } from "@/lib/business";
import { prisma } from "@/lib/db";
import { availabilityQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = availabilityQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Consulta inválida" }, { status: 400 });
  }
  const { slug, serviceId, staffId, date } = parsed.data;

  const business = await getBusinessBySlug(slug);
  if (!business) return NextResponse.json({ error: "Negocio no encontrado" }, { status: 404 });

  // Scoped by businessId: a service id belonging to another business must
  // not resolve here.
  const service = await prisma.service.findFirst({
    where: { id: serviceId, businessId: business.id, active: true },
  });
  if (!service) {
    return NextResponse.json({ error: "Servicio no encontrado" }, { status: 404 });
  }

  let staffIds: string[];
  if (staffId) {
    const link = await prisma.serviceStaff.findFirst({
      where: { serviceId, staffId, staff: { businessId: business.id, active: true } },
    });
    if (!link) {
      return NextResponse.json({ error: "Esta persona no realiza este servicio" }, { status: 400 });
    }
    staffIds = [staffId];
  } else {
    const links = await prisma.serviceStaff.findMany({
      where: { serviceId, staff: { businessId: business.id, active: true } },
      select: { staffId: true },
    });
    staffIds = links.map((l) => l.staffId);
  }

  const slotsByStaff = await Promise.all(
    staffIds.map(async (id) => ({
      staffId: id,
      slots: await getAvailableSlots({
        business,
        staffId: id,
        serviceDurationMinutes: service.durationMinutes,
        date,
      }),
    }))
  );

  // Merge across staff (for "cualquiera disponible") and dedupe by start
  // time, tracking which staff members are free for each slot.
  const merged = new Map<string, { start: string; end: string; staffIds: string[] }>();
  for (const { staffId: sId, slots } of slotsByStaff) {
    for (const slot of slots) {
      const existing = merged.get(slot.start);
      if (existing) {
        existing.staffIds.push(sId);
      } else {
        merged.set(slot.start, { start: slot.start, end: slot.end, staffIds: [sId] });
      }
    }
  }

  const slots = Array.from(merged.values())
    .sort((a, b) => a.start.localeCompare(b.start))
    .map((s) => ({
      start: s.start,
      end: s.end,
      staffIds: s.staffIds,
      label: formatBusinessTime(new Date(s.start), business.timezone),
    }));

  return NextResponse.json({ slots });
}
