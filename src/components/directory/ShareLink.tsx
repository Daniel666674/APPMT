"use client";

import { useState } from "react";
import { Check, Share2 } from "lucide-react";

/**
 * Copies a demo's own link. The library exists to be shared one agenda at a
 * time, so the link is one tap away from every card.
 */
export function ShareLink({ slug, name }: { slug: string; name: string }) {
  const [copied, setCopied] = useState(false);

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        const url = `${window.location.origin}/${slug}`;
        const done = () => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        };
        if (navigator.share) {
          navigator.share({ title: name, url }).then(done, () => navigator.clipboard.writeText(url).then(done, () => {}));
        } else {
          navigator.clipboard.writeText(url).then(done, () => {});
        }
      }}
      className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition hover:bg-secondary hover:text-foreground"
    >
      {copied ? <Check className="h-3.5 w-3.5" /> : <Share2 className="h-3.5 w-3.5" />}
      {copied ? "Copiado" : "Compartir"}
    </button>
  );
}
