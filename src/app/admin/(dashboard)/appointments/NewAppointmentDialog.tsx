"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createAppointment } from "./actions";

interface ServiceOption {
  id: string;
  name: string;
  staffIds: string[];
}
interface StaffOption {
  id: string;
  name: string;
}

export function NewAppointmentDialog({ services, staff }: { services: ServiceOption[]; staff: StaffOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [serviceId, setServiceId] = useState("");
  const [staffId, setStaffId] = useState("");
  const [datetime, setDatetime] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  const eligibleStaff = useMemo(() => {
    const service = services.find((s) => s.id === serviceId);
    if (!service) return staff;
    return staff.filter((s) => service.staffIds.includes(s.id));
  }, [serviceId, services, staff]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!serviceId || !staffId || !datetime) return;
    setSubmitting(true);
    try {
      await createAppointment({
        serviceId,
        staffId,
        startsAt: new Date(datetime).toISOString(),
        customerName,
        customerEmail,
        customerPhone,
        notes,
      });
      toast.success("Cita creada");
      setOpen(false);
      setServiceId("");
      setStaffId("");
      setDatetime("");
      setCustomerName("");
      setCustomerEmail("");
      setCustomerPhone("");
      setNotes("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos crear la cita");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="brand" size="sm">
          <Plus className="h-4 w-4" /> Nueva cita
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nueva cita</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label>Servicio</Label>
              <Select value={serviceId} onValueChange={(v) => { setServiceId(v); setStaffId(""); }}>
                <SelectTrigger>
                  <SelectValue placeholder="Escoge un servicio" />
                </SelectTrigger>
                <SelectContent>
                  {services.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Quién atiende</Label>
              <Select value={staffId} onValueChange={setStaffId} disabled={!serviceId}>
                <SelectTrigger>
                  <SelectValue placeholder="Escoge una persona" />
                </SelectTrigger>
                <SelectContent>
                  {eligibleStaff.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="appt-datetime">Fecha y hora</Label>
            <Input id="appt-datetime" type="datetime-local" value={datetime} onChange={(e) => setDatetime(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="appt-name">Nombre del cliente</Label>
              <Input id="appt-name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} required />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="appt-email">Correo del cliente</Label>
              <Input id="appt-email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} required />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="appt-phone">Celular del cliente (opcional)</Label>
            <Input id="appt-phone" type="tel" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="appt-notes">Notas internas (opcional)</Label>
            <Textarea id="appt-notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="brand" disabled={submitting}>
              {submitting ? "Creando…" : "Crear cita"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
