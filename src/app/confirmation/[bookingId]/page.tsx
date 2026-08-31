import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarCheck } from "lucide-react";
import { formatBusinessDate, formatBusinessTime } from "@/lib/availability";
import { getBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/booking/SiteHeader";
import { SiteFooter } from "@/components/booking/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function ConfirmationPage({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const business = await getBusiness();

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { service: true, staff: true, customer: true },
  });

  if (!booking) notFound();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader business={business} />
      <main className="flex flex-1 items-center justify-center px-4 py-12">
        <Card className="w-full max-w-md">
          <CardContent className="flex flex-col items-center gap-4 py-10 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
              <CalendarCheck className="h-7 w-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">You&apos;re booked!</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                A confirmation email is on its way to {booking.customer.email}.
              </p>
            </div>
            <div className="w-full space-y-1 rounded-lg bg-secondary p-4 text-left text-sm">
              <Row label="Service" value={booking.service.name} />
              <Row label="With" value={booking.staff.name} />
              <Row label="Date" value={formatBusinessDate(booking.startsAt, business.timezone)} />
              <Row label="Time" value={formatBusinessTime(booking.startsAt, business.timezone)} />
            </div>
            <div className="flex w-full flex-col gap-2 pt-2">
              <Button asChild variant="outline">
                <Link href={`/manage/${booking.manageToken}`}>Manage this appointment</Link>
              </Button>
              <Button asChild variant="ghost">
                <Link href="/">Back to home</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <SiteFooter business={business} />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
