import type { Business } from "@/lib/business";

/**
 * The brand kit's type choices. Each entry is a full CSS stack, so a business
 * that picks one gets a real fallback if the webfont never loads.
 */
export const FONT_OPTIONS = [
  { value: "inter", label: "Inter — moderna y neutra", preview: "Aa" },
  { value: "poppins", label: "Poppins — redonda y amable", preview: "Aa" },
  { value: "montserrat", label: "Montserrat — fuerte y comercial", preview: "Aa" },
  { value: "playfair", label: "Playfair — elegante, tipo revista", preview: "Aa" },
  { value: "system", label: "Del sistema — rápida y sobria", preview: "Aa" },
  { value: "serif", label: "Serif clásica", preview: "Aa" },
  { value: "mono", label: "Monoespaciada — técnica", preview: "Aa" },
] as const;

export type FontKey = (typeof FONT_OPTIONS)[number]["value"];

const FONT_STACKS: Record<string, string> = {
  inter: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  poppins: "var(--font-poppins), var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  montserrat: "var(--font-montserrat), var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  playfair: "var(--font-playfair), ui-serif, Georgia, serif",
  system: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  serif: "ui-serif, Georgia, serif",
  mono: "ui-monospace, 'JetBrains Mono', monospace",
};

/** How rounded everything is — the fastest way to change a page's character. */
export const CORNER_OPTIONS = [
  { value: "sharp", label: "Rectas", radius: "0.125rem" },
  { value: "soft", label: "Suaves", radius: "0.65rem" },
  { value: "round", label: "Muy redondeadas", radius: "1.25rem" },
] as const;

export type CornerKey = (typeof CORNER_OPTIONS)[number]["value"];

const CORNER_RADII: Record<string, string> = Object.fromEntries(
  CORNER_OPTIONS.map((c) => [c.value, c.radius])
);

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const bigint = parseInt(clean, 16);
  return { r: (bigint >> 16) & 255, g: (bigint >> 8) & 255, b: bigint & 255 };
}

/** Picks black or white text for readable contrast against a given hex background. */
export function readableForeground(hex: string) {
  try {
    const { r, g, b } = hexToRgb(hex);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6 ? "#18181b" : "#ffffff";
  } catch {
    return "#ffffff";
  }
}

function shade(hex: string, amount: number) {
  try {
    const { r, g, b } = hexToRgb(hex);
    const clamp = (v: number) => Math.max(0, Math.min(255, v));
    const mix = (c: number) => clamp(Math.round(c + (amount > 0 ? (255 - c) * amount : c * amount)));
    const toHex = (c: number) => c.toString(16).padStart(2, "0");
    return `#${toHex(mix(r))}${toHex(mix(g))}${toHex(mix(b))}`;
  } catch {
    return hex;
  }
}

/** The brand color at low opacity, for tinted surfaces and badges. */
function tint(hex: string, alpha: number) {
  try {
    const { r, g, b } = hexToRgb(hex);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  } catch {
    return `rgba(79, 70, 229, ${alpha})`;
  }
}

export type BrandKit = Pick<
  Business,
  "primaryColor" | "accentColor" | "fontFamily" | "cornerStyle"
>;

/**
 * Turns the business's brand kit into CSS custom properties applied at the
 * document root. Every themed component reads colors, type and corner radius
 * from these variables instead of hardcoded Tailwind classes, so rebranding
 * is a settings-page change, not a code change.
 */
export function brandStyle(business: BrandKit): React.CSSProperties {
  return {
    "--brand-primary": business.primaryColor,
    "--brand-primary-hover": shade(business.primaryColor, -0.12),
    "--brand-primary-soft": tint(business.primaryColor, 0.1),
    "--brand-primary-foreground": readableForeground(business.primaryColor),
    "--brand-accent": business.accentColor,
    "--brand-accent-soft": tint(business.accentColor, 0.12),
    "--brand-accent-foreground": readableForeground(business.accentColor),
    "--brand-font": FONT_STACKS[business.fontFamily] ?? FONT_STACKS.inter,
    "--radius": CORNER_RADII[business.cornerStyle] ?? CORNER_RADII.soft,
  } as React.CSSProperties;
}

/** Ready-made palettes, so a client picks a look instead of guessing hex codes. */
export const BRAND_PRESETS = [
  { name: "Violeta", primary: "#7c3aed", accent: "#ec4899" },
  { name: "Índigo", primary: "#4f46e5", accent: "#0ea5e9" },
  { name: "Esmeralda", primary: "#059669", accent: "#f59e0b" },
  { name: "Café", primary: "#7c4a2d", accent: "#d97706" },
  { name: "Negro y oro", primary: "#18181b", accent: "#d4af37" },
  { name: "Vino", primary: "#9f1239", accent: "#fb7185" },
  { name: "Azul clínico", primary: "#0369a1", accent: "#06b6d4" },
  { name: "Rosa", primary: "#db2777", accent: "#a855f7" },
  { name: "Naranja", primary: "#ea580c", accent: "#facc15" },
  { name: "Verde oliva", primary: "#4d7c0f", accent: "#84cc16" },
] as const;
