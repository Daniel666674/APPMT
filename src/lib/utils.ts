import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatMoney(amount: number | string | null | undefined, currency = "COP") {
  if (amount === null || amount === undefined) return null;
  const value = typeof amount === "string" ? Number(amount) : amount;
  if (Number.isNaN(value)) return null;
  if (value === 0) return "Gratis";
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "COP" ? 0 : 2,
  }).format(value);
}

export function formatDuration(minutes: number) {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  const hourLabel = hours === 1 ? "1 hora" : `${hours} horas`;
  return rest === 0 ? hourLabel : `${hourLabel} ${rest} min`;
}

export function minutesToTimeLabel(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? "p. m." : "a. m.";
  const displayHour = h % 12 === 0 ? 12 : h % 12;
  return `${displayHour}:${String(m).padStart(2, "0")} ${period}`;
}

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export const WEEKDAY_LABELS = [
  "Domingo",
  "Lunes",
  "Martes",
  "Miércoles",
  "Jueves",
  "Viernes",
  "Sábado",
];

/** Iniciales de los días para la cuadrícula del calendario, de domingo a sábado. */
export const WEEKDAY_INITIALS = ["D", "L", "M", "M", "J", "V", "S"];
