import Link from "next/link";
import type { Business } from "@/lib/business";

export function SiteHeader({ business }: { business: Business }) {
  return (
    <header className="border-b border-border bg-card/60 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4 sm:px-6">
        <Link href={`/${business.slug}`} className="flex items-center gap-2">
          {business.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={business.logoUrl} alt={business.name} className="h-8 w-auto object-contain" />
          ) : (
            <span className="text-lg font-bold text-brand">{business.name}</span>
          )}
        </Link>
        {business.contactPhone ? (
          <a href={`tel:${business.contactPhone}`} className="text-sm font-medium text-muted-foreground hover:text-foreground">
            {business.contactPhone}
          </a>
        ) : null}
      </div>
    </header>
  );
}
