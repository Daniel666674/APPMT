import "server-only";
import { addDays, addMinutes, format, startOfDay } from "date-fns";
import { es } from "date-fns/locale";
import { fromZonedTime, toZonedTime } from "date-fns-tz";
import { prisma } from "@/lib/db";
import type { Business } from "@/lib/business";

export interface TimeSlot {
  /** ISO-8601 UTC start time */
  start: string;
  /** ISO-8601 UTC end time */
  end: string;
}

interface LocalWindow {
  startMinute: number;
  endMinute: number;
}

function subtractWindow(windows: LocalWindow[], blocked: LocalWindow): LocalWindow[] {
  const result: LocalWindow[] = [];
  for (const w of windows) {
    if (blocked.endMinute <= w.startMinute || blocked.startMinute >= w.endMinute) {
      result.push(w);
      continue;
    }
    if (blocked.startMinute > w.startMinute) {
      result.push({ startMinute: w.startMinute, endMinute: Math.min(blocked.startMinute, w.endMinute) });
    }
    if (blocked.endMinute < w.endMinute) {
      result.push({ startMinute: Math.max(blocked.endMinute, w.startMinute), endMinute: w.endMinute });
    }
  }
  return result.filter((w) => w.endMinute > w.startMinute);
}

/**
 * Computes bookable time slots for a single staff member on a single
 * calendar date (business-local date), respecting weekly availability,
 * time-off exceptions, existing bookings + buffer, minimum notice, and
 * the maximum advance-booking window. Returns UTC ISO timestamps.
 */
export async function getAvailableSlots(params: {
  business: Business;
  staffId: string;
  serviceDurationMinutes: number;
  /** YYYY-MM-DD, interpreted in the business's timezone */
  date: string;
}): Promise<TimeSlot[]> {
  const { business, staffId, serviceDurationMinutes, date } = params;
  const timeZone = business.timezone;

  const localMidnight = fromZonedTime(`${date}T00:00:00`, timeZone);
  const dayOfWeek = toZonedTime(localMidnight, timeZone).getDay();

  const maxAdvanceDate = startOfDay(addDays(new Date(), business.maxAdvanceDays));
  if (localMidnight > maxAdvanceDate) return [];

  const [recurring, timeOffs, existingBookings] = await Promise.all([
    prisma.availability.findMany({ where: { staffId, dayOfWeek } }),
    prisma.timeOff.findMany({
      where: {
        date: fromZonedTime(`${date}T00:00:00`, "UTC"),
        OR: [{ staffId }, { staffId: null }],
      },
    }),
    prisma.booking.findMany({
      where: {
        staffId,
        status: { in: ["PENDING", "CONFIRMED"] },
        startsAt: { lt: fromZonedTime(`${date}T23:59:59`, timeZone) },
        endsAt: { gt: localMidnight },
      },
      select: { startsAt: true, endsAt: true },
    }),
  ]);

  let windows: LocalWindow[] = recurring.map((a) => ({
    startMinute: a.startMinute,
    endMinute: a.endMinute,
  }));

  for (const off of timeOffs) {
    if (off.allDay) {
      windows = [];
      break;
    }
    windows = subtractWindow(windows, {
      startMinute: off.startMinute ?? 0,
      endMinute: off.endMinute ?? 24 * 60,
    });
  }

  if (windows.length === 0) return [];

  const buffer = business.bookingBufferMinutes;
  const bookedRanges = existingBookings.map((b) => ({
    start: addMinutes(b.startsAt, -buffer),
    end: addMinutes(b.endsAt, buffer),
  }));

  const now = new Date();
  const earliestStart = addMinutes(now, business.minNoticeMinutes);
  const interval = business.bookingSlotIntervalMinutes;

  const slots: TimeSlot[] = [];
  for (const window of windows) {
    for (
      let minute = window.startMinute;
      minute + serviceDurationMinutes <= window.endMinute;
      minute += interval
    ) {
      const localStartStr = `${date}T${String(Math.floor(minute / 60)).padStart(2, "0")}:${String(
        minute % 60
      ).padStart(2, "0")}:00`;
      const start = fromZonedTime(localStartStr, timeZone);
      const end = addMinutes(start, serviceDurationMinutes);

      if (start < earliestStart) continue;

      const conflicts = bookedRanges.some((r) => start < r.end && end > r.start);
      if (conflicts) continue;

      slots.push({ start: start.toISOString(), end: end.toISOString() });
    }
  }

  return slots;
}

/** True if the staff member is eligible to perform the given service. */
export async function staffCanPerformService(staffId: string, serviceId: string) {
  const link = await prisma.serviceStaff.findUnique({
    where: { serviceId_staffId: { serviceId, staffId } },
  });
  return Boolean(link);
}

export function formatBusinessDate(date: Date, timeZone: string) {
  return format(toZonedTime(date, timeZone), "EEEE d 'de' MMMM 'de' yyyy", { locale: es });
}

export function formatBusinessTime(date: Date, timeZone: string) {
  return format(toZonedTime(date, timeZone), "h:mm a", { locale: es });
}
