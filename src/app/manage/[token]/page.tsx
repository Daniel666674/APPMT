import { notFound } from "next/navigation";
import { formatBusinessDate, formatBusinessTime } from "@/lib/availability";
import { prisma } from "@/lib/db";
import { brandStyle } from "@/lib/theme";
import { SiteHeader } from "@/components/booking/SiteHeader";
import { SiteFooter } from "@/components/booking/SiteFooter";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CancelBookingButton } from "@/components/booking/CancelBookingButton";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmada",
  PENDING: "Pendiente",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  NO_SHOW: "No asistió",
};

const STATUS_VARIANT: Record<string, "success" | "destructive" | "default" | "warning"> = {
  CONFIRMED: "success",
  PENDING: "warning",
  CANCELLED: "destructive",
  COMPLETED: "default",
  NO_SHOW: "destructive",
};

/**
 * Customer-facing, no login. The token identifies the booking, and the
 * booking identifies which business's branding to render — so this route
 * stays outside /[slug].
 */
export default async function ManageBookingPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  const booking = await prisma.booking.findUnique({
    where: { manageToken: token },
    include: { service: true, staff: true, customer: true, business: true },
  });

  if (!booking) notFound();
  const business = booking.business;

  const canCancel = booking.status === "CONFIRMED" || booking.status === "PENDING";
  const isPast = booking.startsAt < new Date();

  return (
    <div
      style={brandStyle(business)}
      className={business.themeMode === "dark" ? "dark bg-background text-foreground" : undefined}
    >
      <div className="flex min-h-screen flex-col">
        <SiteHeader business={business} />
        <main className="flex flex-1 justify-center px-4 py-12">
          <Card className="h-fit w-full max-w-md">
            <CardContent className="space-y-5 py-8">
              <div className="flex items-start justify-between">
                <div>
                  <h1 className="text-xl font-bold">{booking.service.name}</h1>
                  <p className="text-sm text-muted-foreground">con {booking.staff.name}</p>
                </div>
                <Badge variant={STATUS_VARIANT[booking.status] ?? "default"}>
                  {STATUS_LABELS[booking.status] ?? booking.status}
                </Badge>
              </div>

              <div className="space-y-1 rounded-lg bg-secondary p-4 text-sm">
                <Row label="Fecha" value={formatBusinessDate(booking.startsAt, business.timezone)} />
                <Row label="Hora" value={formatBusinessTime(booking.startsAt, business.timezone)} />
                <Row label="A nombre de" value={booking.customer.name} />
                <Row label="Correo" value={booking.customer.email} />
              </div>

              {booking.status === "CANCELLED" && (
                <p className="text-sm text-muted-foreground">
                  Esta cita fue cancelada{booking.cancelReason ? `: “${booking.cancelReason}”` : "."}
                </p>
              )}

              {canCancel && !isPast ? (
                <CancelBookingButton token={token} />
              ) : canCancel && isPast ? (
                <p className="text-sm text-muted-foreground">La fecha de esta cita ya pasó.</p>
              ) : null}
            </CardContent>
          </Card>
        </main>
        <SiteFooter business={business} />
      </div>
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
