import type { Metadata } from "next";
import { Inter, Montserrat, Playfair_Display, Poppins } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// The brand kit lets each business pick its own type, so every option is
// loaded once here and selected per business through --brand-font.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const poppins = Poppins({ variable: "--font-poppins", subsets: ["latin"], weight: ["400", "500", "600", "700"] });
const montserrat = Montserrat({ variable: "--font-montserrat", subsets: ["latin"] });
const playfair = Playfair_Display({ variable: "--font-playfair", subsets: ["latin"] });

const fontVars = [inter, poppins, montserrat, playfair].map((f) => f.variable).join(" ");

export const metadata: Metadata = {
  title: "Agenda de citas",
};

/**
 * Neutral shell. Per-business branding is applied further down, in
 * app/[slug]/layout.tsx, because this deployment serves many businesses
 * and each has its own colors and fonts.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-CO" className={`${fontVars} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
