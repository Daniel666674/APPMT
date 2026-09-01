"use client";

import { useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  getDay,
  isBefore,
  isSameDay,
  isSameMonth,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn, WEEKDAY_INITIALS } from "@/lib/utils";

export function DatePicker({
  value,
  onChange,
  minDate,
  maxDate,
  closedWeekdays = [],
}: {
  /** YYYY-MM-DD, business-local */
  value: string | null;
  onChange: (date: string) => void;
  minDate: Date;
  maxDate: Date;
  closedWeekdays?: number[];
}) {
  const [cursor, setCursor] = useState(() => startOfMonth(value ? new Date(`${value}T00:00:00`) : minDate));

  const days = useMemo(() => {
    const start = startOfMonth(cursor);
    const end = endOfMonth(cursor);
    const leading = getDay(start);
    const gridStart = addDays(start, -leading);
    const trailing = 6 - getDay(end);
    const gridEnd = addDays(end, trailing);
    return eachDayOfInterval({ start: gridStart, end: gridEnd });
  }, [cursor]);

  const today = startOfDay(new Date());

  return (
    <div className="w-full max-w-sm rounded-xl border border-border bg-card p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setCursor((c) => subMonths(c, 1))}
          disabled={isSameMonth(cursor, minDate) || isBefore(cursor, minDate)}
          className="rounded-md p-1.5 hover:bg-secondary disabled:pointer-events-none disabled:opacity-30"
          aria-label="Mes anterior"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <p className="text-sm font-semibold">{format(cursor, "MMMM yyyy", { locale: es })}</p>
        <button
          type="button"
          onClick={() => setCursor((c) => addMonths(c, 1))}
          disabled={isSameMonth(cursor, maxDate) || isBefore(maxDate, cursor)}
          className="rounded-md p-1.5 hover:bg-secondary disabled:pointer-events-none disabled:opacity-30"
          aria-label="Mes siguiente"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-muted-foreground">
        {WEEKDAY_INITIALS.map((d, i) => (
          <div key={i} className="py-1">
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {days.map((day) => {
          const inMonth = isSameMonth(day, cursor);
          const disabled =
            isBefore(day, today) ||
            isBefore(maxDate, day) ||
            closedWeekdays.includes(getDay(day)) ||
            !inMonth;
          const dateStr = format(day, "yyyy-MM-dd");
          const selected = value === dateStr;
          const isToday = isSameDay(day, today);

          return (
            <button
              key={dateStr}
              type="button"
              disabled={disabled}
              onClick={() => onChange(dateStr)}
              className={cn(
                "aspect-square rounded-md text-sm transition-colors disabled:pointer-events-none disabled:opacity-30",
                !inMonth && "invisible",
                selected
                  ? "bg-brand text-brand-foreground font-semibold"
                  : "hover:bg-secondary",
                isToday && !selected && "border border-brand text-brand font-semibold"
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
