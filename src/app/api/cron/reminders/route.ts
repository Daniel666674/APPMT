import { addHours } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { formatBusinessDate, formatBusinessTime } from "@/lib/availability";
import { prisma } from "@/lib/db";
import { sendBookingReminderEmail } from "@/lib/email";

/**
 * Sends a reminder email for every confirmed booking starting within the
 * next 36 hours that hasn't already had one. Driven by Vercel Cron once a
 * day (see vercel.json) — Vercel's Hobby plan only permits daily
 * schedules, and a deployment is rejected outright if the schedule is more
 * frequent than that. The 36-hour sweep (rather than a narrow 23–25h
 * band) means every booking still gets exactly one reminder, roughly
 * 12–36 hours ahead, even though the job only runs once a day.
 *
 * On a paid plan you can tighten this: set the schedule to hourly and
 * narrow the window back down for more precise 24-hour reminders.
 *
 * One sweep covers every business on the deployment. Each booking carries
 * its own business, so the timezone, branding and address in the email are
 * always the ones the customer actually booked with.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const windowEnd = addHours(now, 36);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      startsAt: { gte: now, lte: windowEnd },
    },
    include: { service: true, staff: true, customer: true, business: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  let sent = 0;

  for (const booking of bookings) {
    const business = booking.business;
    try {
      await sendBookingReminderEmail({
        businessName: business.name,
        logoUrl: business.logoUrl,
        primaryColor: business.primaryColor,
        customerName: booking.customer.name,
        customerEmail: booking.customer.email,
        serviceName: booking.service.name,
        staffName: booking.staff.name,
        dateLabel: formatBusinessDate(booking.startsAt, business.timezone),
        timeLabel: formatBusinessTime(booking.startsAt, business.timezone),
        start: booking.startsAt,
        end: booking.endsAt,
        manageUrl: `${appUrl}/manage/${booking.manageToken}`,
        location: business.address ?? undefined,
      });
      await prisma.booking.update({ where: { id: booking.id }, data: { reminderSentAt: now } });
      sent += 1;
    } catch (err) {
      console.error(`[cron] reminder failed for booking ${booking.id}:`, err);
    }
  }

  return NextResponse.json({ checked: bookings.length, sent });
}
