"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createService, updateService } from "./actions";

interface StaffOption {
  id: string;
  name: string;
}

interface ServiceValues {
  id?: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number | null;
  color: string;
  active: boolean;
  staffIds: string[];
}

export function ServiceFormDialog({
  trigger,
  staffOptions,
  initial,
}: {
  trigger: React.ReactNode;
  staffOptions: StaffOption[];
  initial?: ServiceValues;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [duration, setDuration] = useState(initial?.durationMinutes ?? 30);
  const [price, setPrice] = useState(initial?.price?.toString() ?? "");
  const [color, setColor] = useState(initial?.color ?? "#4f46e5");
  const [staffIds, setStaffIds] = useState<string[]>(initial?.staffIds ?? []);

  function toggleStaff(id: string) {
    setStaffIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        name,
        description,
        durationMinutes: duration,
        price: price === "" ? null : Number(price),
        color,
        staffIds,
      };
      if (initial?.id) {
        await updateService(initial.id, payload);
        toast.success("Servicio actualizado");
      } else {
        await createService(payload);
        toast.success("Servicio creado");
      }
      setOpen(false);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Algo salió mal");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initial?.id ? "Editar servicio" : "Nuevo servicio"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="svc-name">Nombre</Label>
            <Input id="svc-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-desc">Descripción</Label>
            <Textarea id="svc-desc" value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="svc-duration">Duración (minutos)</Label>
              <Input
                id="svc-duration"
                type="number"
                min={5}
                step={5}
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="svc-price">Precio (opcional)</Label>
              <Input id="svc-price" type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="svc-color">Color en el calendario</Label>
            <input
              id="svc-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-16 rounded border border-input bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Quién puede realizar este servicio</Label>
            <div className="flex flex-wrap gap-2">
              {staffOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">Primero agrega personas al equipo.</p>
              ) : (
                staffOptions.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleStaff(s.id)}
                    className={
                      "rounded-full border px-3 py-1 text-xs transition-colors " +
                      (staffIds.includes(s.id) ? "border-brand bg-brand text-brand-foreground" : "border-border hover:bg-secondary")
                    }
                  >
                    {s.name}
                  </button>
                ))
              )}
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button type="submit" variant="brand" disabled={submitting}>
              {submitting ? "Guardando…" : "Guardar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
