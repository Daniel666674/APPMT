import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getBusiness } from "@/lib/business";
import { brandStyle } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  try {
    const business = await getBusiness();
    return {
      title: `${business.name} — Book an appointment`,
      description: business.heroSubheadline ?? `Book your next appointment with ${business.name} online.`,
      icons: business.faviconUrl ? [{ url: business.faviconUrl }] : undefined,
    };
  } catch {
    return { title: "Appointment Scheduler" };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let style: React.CSSProperties = {};
  let themeMode = "light";
  try {
    const business = await getBusiness();
    style = brandStyle(business);
    themeMode = business.themeMode;
  } catch {
    // No business row yet (fresh install before seeding) — fall back to defaults.
  }

  return (
    <html
      lang="en"
      className={cn(inter.variable, "h-full antialiased", themeMode === "dark" && "dark")}
      style={style}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
