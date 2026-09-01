import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { getBusinessOrNull } from "@/lib/business";
import { brandStyle } from "@/lib/theme";
import { cn } from "@/lib/utils";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const business = await getBusinessOrNull();
  if (!business) return { title: "Appointment Scheduler" };
  return {
    title: `${business.name} — Book an appointment`,
    description: business.heroSubheadline ?? `Book your next appointment with ${business.name} online.`,
    icons: business.faviconUrl ? [{ url: business.faviconUrl }] : undefined,
  };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Null before setup has run — the app still renders, with default theming.
  const business = await getBusinessOrNull();
  const style: React.CSSProperties = business ? brandStyle(business) : {};
  const themeMode = business?.themeMode ?? "light";

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
