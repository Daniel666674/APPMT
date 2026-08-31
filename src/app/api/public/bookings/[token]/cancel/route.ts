import { subHours } from "date-fns";
import { NextRequest, NextResponse } from "next/server";
import { formatBusinessDate, formatBusinessTime } from "@/lib/availability";
import { getBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { sendBookingCancelledEmail } from "@/lib/email";
import { cancelBookingSchema } from "@/lib/validations";

export async function POST(request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const body = await request.json().catch(() => ({}));
  const parsed = cancelBookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { service: true, customer: true, staff: true },
  });
  if (!booking) return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
  if (booking.status === "CANCELLED") {
    return NextResponse.json({ error: "This appointment is already cancelled." }, { status: 400 });
  }

  const business = await getBusiness();
  const now = new Date();

  if (booking.startsAt < now) {
    return NextResponse.json({ error: "This appointment has already passed." }, { status: 400 });
  }

  const cutoff = subHours(booking.startsAt, business.cancellationWindowHours);
  if (now > cutoff) {
    const contact = business.contactPhone || business.contactEmail || "the business directly";
    return NextResponse.json(
      {
        error: `This appointment is within the ${business.cancellationWindowHours}-hour cancellation window. Please contact ${contact} to cancel.`,
      },
      { status: 400 }
    );
  }

  const updated = await prisma.booking.update({
    where: { id: booking.id },
    data: { status: "CANCELLED", cancelledAt: now, cancelReason: parsed.data.reason || undefined },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? request.nextUrl.origin;
  await sendBookingCancelledEmail({
    businessName: business.name,
    logoUrl: business.logoUrl,
    primaryColor: business.primaryColor,
    customerName: booking.customer.name,
    customerEmail: booking.customer.email,
    serviceName: booking.service.name,
    staffName: booking.staff.name,
    dateLabel: formatBusinessDate(booking.startsAt, business.timezone),
    timeLabel: formatBusinessTime(booking.startsAt, business.timezone),
    bookAgainUrl: `${appUrl}/book/${booking.serviceId}`,
  }).catch((err) => console.error("[email] cancellation failed:", err));

  return NextResponse.json({ status: updated.status });
}
