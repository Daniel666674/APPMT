"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { updateAppointmentStatus } from "./actions";

const STATUS_VARIANT: Record<string, "success" | "destructive" | "default" | "warning"> = {
  CONFIRMED: "success",
  PENDING: "warning",
  CANCELLED: "destructive",
  COMPLETED: "default",
  NO_SHOW: "destructive",
};

const STATUS_LABELS: Record<string, string> = {
  CONFIRMED: "Confirmada",
  PENDING: "Pendiente",
  CANCELLED: "Cancelada",
  COMPLETED: "Completada",
  NO_SHOW: "No asistió",
};

const OPTIONS = ["CONFIRMED", "PENDING", "COMPLETED", "NO_SHOW", "CANCELLED"] as const;

export function AppointmentStatusMenu({ id, status }: { id: string; status: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  async function handleChange(next: (typeof OPTIONS)[number]) {
    if (next === status) return;
    setPending(true);
    try {
      await updateAppointmentStatus(id, next);
      toast.success(`Marcada como ${(STATUS_LABELS[next] ?? next).toLowerCase()}`);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No pudimos actualizar el estado");
    } finally {
      setPending(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger disabled={pending} className="inline-flex items-center gap-1 disabled:opacity-50">
        <Badge variant={STATUS_VARIANT[status] ?? "default"}>{STATUS_LABELS[status] ?? status}</Badge>
        <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {OPTIONS.map((opt) => (
          <DropdownMenuItem key={opt} onClick={() => handleChange(opt)}>
            {STATUS_LABELS[opt]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
