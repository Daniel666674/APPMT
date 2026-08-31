import type { Business } from "@/lib/business";

const FONT_STACKS: Record<string, string> = {
  inter: "var(--font-inter), ui-sans-serif, system-ui, sans-serif",
  system: "ui-sans-serif, system-ui, -apple-system, sans-serif",
  serif: "ui-serif, Georgia, serif",
  mono: "ui-monospace, 'JetBrains Mono', monospace",
};

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

/**
 * Turns the business's brand kit into CSS custom properties applied at the
 * document root. Every themed component reads colors from these variables
 * instead of hardcoded Tailwind classes, so rebranding is a settings-page
 * change, not a code change.
 */
export function brandStyle(business: Pick<Business, "primaryColor" | "accentColor" | "fontFamily">): React.CSSProperties {
  return {
    "--brand-primary": business.primaryColor,
    "--brand-primary-hover": shade(business.primaryColor, -0.12),
    "--brand-primary-foreground": readableForeground(business.primaryColor),
    "--brand-accent": business.accentColor,
    "--brand-accent-foreground": readableForeground(business.accentColor),
    "--brand-font": FONT_STACKS[business.fontFamily] ?? FONT_STACKS.inter,
  } as React.CSSProperties;
}
