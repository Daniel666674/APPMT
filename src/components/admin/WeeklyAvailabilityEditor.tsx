"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { WEEKDAY_LABELS } from "@/lib/utils";
import { saveWeeklyAvailability } from "@/app/admin/(dashboard)/staff/actions";

interface Block {
  startMinute: number;
  endMinute: number;
}

function minutesToInputTime(minutes: number) {
  const h = Math.floor(minutes / 60)
    .toString()
    .padStart(2, "0");
  const m = (minutes % 60).toString().padStart(2, "0");
  return `${h}:${m}`;
}

function inputTimeToMinutes(value: string) {
  const [h, m] = value.split(":").map(Number);
  return h * 60 + m;
}

export function WeeklyAvailabilityEditor({
  staffId,
  initialSchedule,
}: {
  staffId: string;
  initialSchedule: Record<number, Block[]>;
}) {
  const router = useRouter();
  const [schedule, setSchedule] = useState<Record<number, Block[]>>(initialSchedule);
  const [saving, setSaving] = useState(false);

  function addBlock(day: number) {
    setSchedule((prev) => ({
      ...prev,
      [day]: [...(prev[day] ?? []), { startMinute: 9 * 60, endMinute: 17 * 60 }],
    }));
  }

  function removeBlock(day: number, index: number) {
    setSchedule((prev) => ({ ...prev, [day]: prev[day]!.filter((_, i) => i !== index) }));
  }

  function updateBlock(day: number, index: number, field: "startMinute" | "endMinute", value: string) {
    setSchedule((prev) => ({
      ...prev,
      [day]: prev[day]!.map((b, i) => (i === index ? { ...b, [field]: inputTimeToMinutes(value) } : b)),
    }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      const blocks = Object.entries(schedule).flatMap(([day, blocks]) =>
        blocks.map((b) => ({ dayOfWeek: Number(day), ...b }))
      );
      await saveWeeklyAvailability(staffId, { blocks });
      toast.success("Weekly hours saved");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Couldn't save hours");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      {WEEKDAY_LABELS.map((label, day) => {
        const blocks = schedule[day] ?? [];
        const isOpen = blocks.length > 0;
        return (
          <div key={day} className="flex flex-col gap-2 border-b border-border pb-4 last:border-0 sm:flex-row sm:items-start">
            <div className="flex w-32 shrink-0 items-center gap-2 pt-1.5">
              <Switch
                checked={isOpen}
                onCheckedChange={(checked) =>
                  setSchedule((prev) => ({ ...prev, [day]: checked ? [{ startMinute: 9 * 60, endMinute: 17 * 60 }] : [] }))
                }
              />
              <span className="text-sm font-medium">{label}</span>
            </div>
            <div className="flex-1 space-y-2">
              {isOpen ? (
                blocks.map((b, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="time"
                      value={minutesToInputTime(b.startMinute)}
                      onChange={(e) => updateBlock(day, i, "startMinute", e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                    />
                    <span className="text-muted-foreground">to</span>
                    <input
                      type="time"
                      value={minutesToInputTime(b.endMinute)}
                      onChange={(e) => updateBlock(day, i, "endMinute", e.target.value)}
                      className="rounded-md border border-input bg-background px-2 py-1 text-sm"
                    />
                    <Button type="button" variant="ghost" size="icon" onClick={() => removeBlock(day, i)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                    {i === blocks.length - 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => addBlock(day)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))
              ) : (
                <p className="pt-1.5 text-sm text-muted-foreground">Closed</p>
              )}
            </div>
          </div>
        );
      })}
      <Button variant="brand" onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save weekly hours"}
      </Button>
    </div>
  );
}
