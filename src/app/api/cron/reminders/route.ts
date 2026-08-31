import { addHours } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { formatBusinessDate, formatBusinessTime } from "@/lib/availability";
import { getBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { sendBookingReminderEmail } from "@/lib/email";

/**
 * Sends a reminder email for every confirmed booking starting 23–25 hours
 * from now that hasn't already gotten one. Meant to be hit by Vercel Cron
 * (see vercel.json) roughly once an hour — the 2-hour window keeps it
 * reliable even if a run is skipped or delayed.
 */
export async function GET(request: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = request.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const business = await getBusiness();
  const now = new Date();
  const windowStart = addHours(now, 23);
  const windowEnd = addHours(now, 25);

  const bookings = await prisma.booking.findMany({
    where: {
      status: "CONFIRMED",
      reminderSentAt: null,
      startsAt: { gte: windowStart, lte: windowEnd },
    },
    include: { service: true, staff: true, customer: true },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  let sent = 0;

  for (const booking of bookings) {
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
