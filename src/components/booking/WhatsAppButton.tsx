import { MessageCircle } from "lucide-react";

/**
 * Floating WhatsApp button. In Colombia a booking page without one loses the
 * customer who has a question before they'll commit to a time, so every
 * business that gives us a number gets it.
 */
export function WhatsAppButton({ number, businessName }: { number: string; businessName: string }) {
  const text = encodeURIComponent(`Hola ${businessName}, quiero preguntar por una cita.`);
  return (
    <a
      href={`https://wa.me/${number}?text=${text}`}
      target="_blank"
      rel="noreferrer"
      aria-label="Escribir por WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:brightness-95"
    >
      <MessageCircle className="h-5 w-5" />
      <span className="hidden sm:inline">Escríbenos</span>
    </a>
  );
}
