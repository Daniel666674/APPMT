"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { format } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { createTimeOff, deleteTimeOff } from "@/app/admin/(dashboard)/staff/actions";

interface TimeOffEntry {
  id: string;
  date: string; // YYYY-MM-DD
  allDay: boolean;
  startMinute: number | null;
  endMinute: number | null;
  reason: string | null;
}

export function TimeOffManager({ staffId, entries }: { staffId: string | null; entries: TimeOffEntry[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [date, setDate] = useState("");
  const [allDay, setAllDay] = useState(true);
  const [reason, setReason] = useState("");

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!date) return;
    setSubmitting(true);
    try {
      await createTimeOff({ staffId, date, allDay, reason });
      toast.success("Time off added");
      setOpen(false);
      setDate("");
      setReason("");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't add time off");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this time off entry?")) return;
    try {
      await deleteTimeOff(id);
      toast.success("Removed");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't remove entry");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4" /> Add time off
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add time off</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleAdd} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="timeoff-date">Date</Label>
                <Input id="timeoff-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={allDay} onCheckedChange={setAllDay} />
                <Label>All day</Label>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="timeoff-reason">Reason (optional)</Label>
                <Input id="timeoff-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Vacation, holiday…" />
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                  Cancel
                </Button>
                <Button type="submit" variant="brand" disabled={submitting}>
                  {submitting ? "Saving…" : "Add"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
      {entries.length === 0 ? (
        <p className="text-sm text-muted-foreground">No upcoming time off.</p>
      ) : (
        <ul className="divide-y divide-border">
          {entries.map((entry) => (
            <li key={entry.id} className="flex items-center justify-between py-2 text-sm">
              <span>
                {format(new Date(`${entry.date}T00:00:00`), "MMM d, yyyy")}
                {entry.reason ? ` — ${entry.reason}` : ""}
                {!entry.allDay && entry.startMinute !== null && entry.endMinute !== null ? " (partial day)" : ""}
              </span>
              <Button variant="ghost" size="icon" onClick={() => handleDelete(entry.id)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
