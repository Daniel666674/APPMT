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
import { createStaff, updateStaff } from "./actions";

interface ServiceOption {
  id: string;
  name: string;
}

interface StaffValues {
  id?: string;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  color: string;
  serviceIds: string[];
}

export function StaffFormDialog({
  trigger,
  serviceOptions,
  initial,
}: {
  trigger: React.ReactNode;
  serviceOptions: ServiceOption[];
  initial?: StaffValues;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [email, setEmail] = useState(initial?.email ?? "");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [bio, setBio] = useState(initial?.bio ?? "");
  const [color, setColor] = useState(initial?.color ?? "#4f46e5");
  const [serviceIds, setServiceIds] = useState<string[]>(initial?.serviceIds ?? []);

  function toggleService(id: string) {
    setServiceIds((prev) => (prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = { name, email, phone, bio, color, serviceIds };
      if (initial?.id) {
        await updateStaff(initial.id, payload);
        toast.success("Persona actualizada");
      } else {
        await createStaff(payload);
        toast.success("Persona agregada");
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
          <DialogTitle>{initial?.id ? "Editar persona" : "Agregar persona"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="staff-name">Nombre</Label>
            <Input id="staff-name" value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="staff-email">Correo</Label>
              <Input id="staff-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="staff-phone">Celular</Label>
              <Input id="staff-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-bio">Descripción</Label>
            <Textarea id="staff-bio" value={bio} onChange={(e) => setBio(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="staff-color">Color en el calendario</Label>
            <input
              id="staff-color"
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="h-9 w-16 rounded border border-input bg-background"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Servicios que realiza</Label>
            <div className="flex flex-wrap gap-2">
              {serviceOptions.length === 0 ? (
                <p className="text-xs text-muted-foreground">Primero agrega servicios.</p>
              ) : (
                serviceOptions.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => toggleService(s.id)}
                    className={
                      "rounded-full border px-3 py-1 text-xs transition-colors " +
                      (serviceIds.includes(s.id) ? "border-brand bg-brand text-brand-foreground" : "border-border hover:bg-secondary")
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
