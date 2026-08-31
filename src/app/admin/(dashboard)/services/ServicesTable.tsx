"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { formatDuration, formatMoney } from "@/lib/utils";
import { ServiceFormDialog } from "./ServiceFormDialog";
import { deleteService, toggleServiceActive } from "./actions";

interface ServiceRow {
  id: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number | null;
  color: string;
  active: boolean;
  staffIds: string[];
}

export function ServicesTable({
  services,
  staffOptions,
  currency,
}: {
  services: ServiceRow[];
  staffOptions: { id: string; name: string }[];
  currency: string;
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleToggle(id: string, active: boolean) {
    setPendingId(id);
    try {
      await toggleServiceActive(id, active);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update service");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Delete "${name}"? This can't be undone.`)) return;
    setPendingId(id);
    try {
      await deleteService(id);
      toast.success("Service deleted");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't delete service");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <ServiceFormDialog
          staffOptions={staffOptions}
          trigger={
            <Button variant="brand" size="sm">
              <Plus className="h-4 w-4" /> New service
            </Button>
          }
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Service</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {services.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="py-10 text-center text-muted-foreground">
                No services yet. Create your first one.
              </TableCell>
            </TableRow>
          ) : (
            services.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} />
                    <span className="font-medium">{s.name}</span>
                  </div>
                </TableCell>
                <TableCell>{formatDuration(s.durationMinutes)}</TableCell>
                <TableCell>{s.price !== null ? formatMoney(s.price, currency) : "—"}</TableCell>
                <TableCell>
                  <Switch
                    checked={s.active}
                    disabled={pendingId === s.id}
                    onCheckedChange={(checked) => handleToggle(s.id, checked)}
                  />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <ServiceFormDialog
                      staffOptions={staffOptions}
                      initial={{ ...s }}
                      trigger={
                        <Button variant="ghost" size="icon">
                          <Pencil className="h-4 w-4" />
                        </Button>
                      }
                    />
                    <Button variant="ghost" size="icon" disabled={pendingId === s.id} onClick={() => handleDelete(s.id, s.name)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
