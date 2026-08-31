"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarClock, Pencil, Plus, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Avatar } from "@/components/ui/avatar";
import { StaffFormDialog } from "./StaffFormDialog";
import { deleteStaff, toggleStaffActive } from "./actions";

interface StaffRow {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  bio: string | null;
  color: string;
  avatarUrl: string | null;
  active: boolean;
  serviceIds: string[];
}

export function StaffTable({
  staff,
  serviceOptions,
}: {
  staff: StaffRow[];
  serviceOptions: { id: string; name: string }[];
}) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);

  async function handleToggle(id: string, active: boolean) {
    setPendingId(id);
    try {
      await toggleStaffActive(id, active);
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't update");
    } finally {
      setPendingId(null);
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Remove "${name}"? This can't be undone.`)) return;
    setPendingId(id);
    try {
      await deleteStaff(id);
      toast.success("Staff member removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove staff member");
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <StaffFormDialog
          serviceOptions={serviceOptions}
          trigger={
            <Button variant="brand" size="sm">
              <Plus className="h-4 w-4" /> New staff member
            </Button>
          }
        />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Contact</TableHead>
            <TableHead>Active</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {staff.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="py-10 text-center text-muted-foreground">
                No staff members yet.
              </TableCell>
            </TableRow>
          ) : (
            staff.map((s) => (
              <TableRow key={s.id}>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar name={s.name} src={s.avatarUrl} color={s.color} size={32} />
                    <span className="font-medium">{s.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">{s.email || s.phone || "—"}</TableCell>
                <TableCell>
                  <Switch checked={s.active} disabled={pendingId === s.id} onCheckedChange={(checked) => handleToggle(s.id, checked)} />
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-1">
                    <Button variant="ghost" size="icon" asChild>
                      <Link href={`/admin/staff/${s.id}/availability`} title="Availability">
                        <CalendarClock className="h-4 w-4" />
                      </Link>
                    </Button>
                    <StaffFormDialog
                      serviceOptions={serviceOptions}
                      initial={s}
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
