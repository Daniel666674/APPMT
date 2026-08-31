import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots, formatBusinessTime, staffCanPerformService } from "@/lib/availability";
import { getBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { availabilityQuerySchema } from "@/lib/validations";

export async function GET(request: NextRequest) {
  const params = Object.fromEntries(request.nextUrl.searchParams);
  const parsed = availabilityQuerySchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid query" }, { status: 400 });
  }
  const { serviceId, staffId, date } = parsed.data;

  const business = await getBusiness();
  const service = await prisma.service.findUnique({ where: { id: serviceId } });
  if (!service || !service.active) {
    return NextResponse.json({ error: "Service not found" }, { status: 404 });
  }

  let staffIds: string[];
  if (staffId) {
    const eligible = await staffCanPerformService(staffId, serviceId);
    if (!eligible) return NextResponse.json({ error: "Staff cannot perform this service" }, { status: 400 });
    staffIds = [staffId];
  } else {
    const links = await prisma.serviceStaff.findMany({
      where: { serviceId, staff: { active: true } },
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

  // Merge across staff (for "any available" bookings) and dedupe by start time,
  // keeping track of which staff members are free for each slot.
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
