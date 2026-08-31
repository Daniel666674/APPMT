import { notFound } from "next/navigation";
import { formatBusinessDate, formatBusinessTime } from "@/lib/availability";
import { getBusiness } from "@/lib/business";
import { prisma } from "@/lib/db";
import { SiteHeader } from "@/components/booking/SiteHeader";
import { SiteFooter } from "@/components/booking/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CancelBookingButton } from "@/components/booking/CancelBookingButton";

const STATUS_VARIANT: Record<string, "success" | "destructive" | "default" | "warning"> = {
  CONFIRMED: "success",
  PENDING: "warning",
  CANCELLED: "destructive",
  COMPLETED: "default",
  NO_SHOW: "destructive",
};

export default async function ManageBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const business = await getBusiness();

  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { service: true, staff: true, customer: true },
  });

  if (!booking) notFound();

  const canCancel = booking.status === "CONFIRMED" || booking.status === "PENDING";
  const isPast = booking.startsAt < new Date();

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader business={business} />
      <main className="flex flex-1 justify-center px-4 py-12">
        <Card className="h-fit w-full max-w-md">
          <CardContent className="space-y-5 py-8">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-xl font-bold">{booking.service.name}</h1>
                <p className="text-sm text-muted-foreground">with {booking.staff.name}</p>
              </div>
              <Badge variant={STATUS_VARIANT[booking.status] ?? "default"}>{booking.status}</Badge>
            </div>

            <div className="space-y-1 rounded-lg bg-secondary p-4 text-sm">
              <Row label="Date" value={formatBusinessDate(booking.startsAt, business.timezone)} />
              <Row label="Time" value={formatBusinessTime(booking.startsAt, business.timezone)} />
              <Row label="Booked for" value={booking.customer.name} />
              <Row label="Email" value={booking.customer.email} />
            </div>

            {booking.status === "CANCELLED" && (
              <p className="text-sm text-muted-foreground">
                This appointment was cancelled{booking.cancelReason ? `: “${booking.cancelReason}”` : "."}
              </p>
            )}

            {canCancel && !isPast ? (
              <CancelBookingButton token={token} />
            ) : canCancel && isPast ? (
              <p className="text-sm text-muted-foreground">This appointment time has already passed.</p>
            ) : null}
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
