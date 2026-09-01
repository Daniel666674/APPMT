import { Link2, Mail, MapPin, Phone } from "lucide-react";
import type { Business } from "@/lib/business";

export function SiteFooter({ business }: { business: Business }) {
  const hasContact = business.contactEmail || business.contactPhone || business.address;
  const hasSocial = business.instagramUrl || business.facebookUrl;

  return (
    <footer className="mt-auto border-t border-border bg-card/40">
      <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-8 text-sm text-muted-foreground sm:px-6">
        {hasContact ? (
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            {business.contactPhone && (
              <span className="inline-flex items-center gap-1.5">
                <Phone className="h-3.5 w-3.5" /> {business.contactPhone}
              </span>
            )}
            {business.contactEmail && (
              <span className="inline-flex items-center gap-1.5">
                <Mail className="h-3.5 w-3.5" /> {business.contactEmail}
              </span>
            )}
            {business.address && (
              <span className="inline-flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" /> {business.address}
              </span>
            )}
          </div>
        ) : null}
        {hasSocial ? (
          <div className="flex gap-4">
            {business.instagramUrl && (
              <a
                href={business.instagramUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <Link2 className="h-3.5 w-3.5" /> Instagram
              </a>
            )}
            {business.facebookUrl && (
              <a
                href={business.facebookUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 hover:text-foreground"
              >
                <Link2 className="h-3.5 w-3.5" /> Facebook
              </a>
            )}
          </div>
        ) : null}
        <p className="text-xs">
          © {new Date().getFullYear()} {business.name}. Todos los derechos reservados.
        </p>
      </div>
    </footer>
  );
}
