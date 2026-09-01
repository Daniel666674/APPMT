"use client";

import { useMemo, useState } from "react";
import { addDays, startOfDay } from "date-fns";
import { useRouter } from "next/navigation";
import { Check, Clock, Loader2 } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { formatDuration, formatMoney, cn } from "@/lib/utils";
import { DatePicker } from "@/components/booking/DatePicker";
import { ContactForm, type ContactFormValues } from "@/components/booking/ContactForm";

interface StaffOption {
  id: string;
  name: string;
  avatarUrl: string | null;
  color: string;
}

interface Slot {
  start: string;
  end: string;
  staffIds: string[];
  label: string;
}

const ANY_STAFF = "__any__";

export function BookingWizard({
  business,
  service,
  staffOptions,
}: {
  business: { timezone: string; currency: string; minNoticeMinutes: number; maxAdvanceDays: number; requirePhone: boolean };
  service: { id: string; name: string; description: string | null; durationMinutes: number; price: number | null };
  staffOptions: StaffOption[];
}) {
  const router = useRouter();
  const showAnyOption = staffOptions.length > 1;
  const [staffId, setStaffId] = useState<string>(showAnyOption ? ANY_STAFF : staffOptions[0]!.id);
  const [date, setDate] = useState<string | null>(null);
  const [slots, setSlots] = useState<Slot[] | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<Slot | null>(null);
  const [step, setStep] = useState<"time" | "details">("time");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const minDate = startOfDay(new Date());
  const maxDate = addDays(minDate, business.maxAdvanceDays);

  async function fetchSlots(forDate: string) {
    setLoadingSlots(true);
    setError(null);
    const query = new URLSearchParams({ serviceId: service.id, date: forDate });
    if (staffId !== ANY_STAFF) query.set("staffId", staffId);
    try {
      const res = await fetch(`/api/public/availability?${query.toString()}`);
      const data = await res.json();
      setSlots(data.slots ?? []);
    } catch {
      setError("No pudimos cargar los horarios. Intenta de nuevo.");
    } finally {
      setLoadingSlots(false);
    }
  }

  function handleDateChange(newDate: string) {
    setDate(newDate);
    setSelectedSlot(null);
    fetchSlots(newDate);
  }

  function handleStaffChange(id: string) {
    setStaffId(id);
    setDate(null);
    setSlots(null);
    setSelectedSlot(null);
  }

  async function handleSubmit(values: ContactFormValues) {
    if (!selectedSlot) return;
    setSubmitting(true);
    setError(null);

    const resolvedStaffId =
      staffId === ANY_STAFF
        ? selectedSlot.staffIds[Math.floor(Math.random() * selectedSlot.staffIds.length)]
        : staffId;

    try {
      const res = await fetch("/api/public/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          serviceId: service.id,
          staffId: resolvedStaffId,
          startsAt: selectedSlot.start,
          customerName: values.customerName,
          customerEmail: values.customerEmail,
          customerPhone: values.customerPhone || "",
          customerNotes: values.customerNotes || "",
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Algo salió mal. Intenta de nuevo.");
        setStep("time");
        setSelectedSlot(null);
        if (date) fetchSlots(date);
        return;
      }
      router.push(`/confirmation/${data.id}`);
    } catch {
      setError("Error de conexión. Intenta de nuevo.");
    } finally {
      setSubmitting(false);
    }
  }

  const priceLabel = useMemo(
    () => (service.price !== null ? formatMoney(service.price, business.currency) : null),
    [service.price, business.currency]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">{service.name}</h1>
        <div className="mt-1 flex items-center gap-3 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" /> {formatDuration(service.durationMinutes)}
          </span>
          {priceLabel && <span className="font-medium text-brand">{priceLabel}</span>}
        </div>
        {service.description ? <p className="mt-3 text-sm text-muted-foreground">{service.description}</p> : null}
      </div>

      {error ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
      ) : null}

      {step === "time" && (
        <div className="space-y-6">
          {showAnyOption && (
            <div>
              <p className="mb-2 text-sm font-medium">Elige con quién</p>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleStaffChange(ANY_STAFF)}
                  className={cn(
                    "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                    staffId === ANY_STAFF ? "border-brand bg-brand text-brand-foreground" : "border-border hover:bg-secondary"
                  )}
                >
                  Cualquiera disponible
                </button>
                {staffOptions.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleStaffChange(s.id)}
                    className={cn(
                      "flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm transition-colors",
                      staffId === s.id ? "border-brand bg-brand text-brand-foreground" : "border-border hover:bg-secondary"
                    )}
                  >
                    <Avatar name={s.name} src={s.avatarUrl} color={s.color} size={20} />
                    {s.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div>
            <p className="mb-2 text-sm font-medium">Elige la fecha</p>
            <DatePicker value={date} onChange={handleDateChange} minDate={minDate} maxDate={maxDate} />
          </div>

          {date && (
            <div>
              <p className="mb-2 text-sm font-medium">Elige la hora</p>
              {loadingSlots ? (
                <div className="flex items-center gap-2 py-6 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Cargando horarios…
                </div>
              ) : slots && slots.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {slots.map((slot) => (
                    <button
                      key={slot.start}
                      type="button"
                      onClick={() => {
                        setSelectedSlot(slot);
                        setStep("details");
                      }}
                      className="rounded-md border border-border px-3 py-2 text-sm transition-colors hover:border-brand hover:bg-brand/5"
                    >
                      {slot.label}
                    </button>
                  ))}
                </div>
              ) : (
                <Card>
                  <CardContent className="py-6 text-center text-sm text-muted-foreground">
                    No hay horarios disponibles ese día. Prueba con otra fecha.
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {step === "details" && selectedSlot && (
        <div className="space-y-4">
          <Card>
            <CardContent className="flex items-center gap-3 py-4">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand/10 text-brand">
                <Check className="h-4 w-4" />
              </div>
              <div className="text-sm">
                <p className="font-medium">{date}</p>
                <p className="text-muted-foreground">{selectedSlot.label}</p>
              </div>
            </CardContent>
          </Card>
          <ContactForm
            requirePhone={business.requirePhone}
            submitting={submitting}
            onSubmit={handleSubmit}
            onBack={() => setStep("time")}
          />
        </div>
      )}
    </div>
  );
}
