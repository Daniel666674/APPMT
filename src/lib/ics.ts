/** Minimal RFC 5545 calendar invite generator — no dependency needed. */
export function buildIcsEvent(params: {
  uid: string;
  title: string;
  description?: string;
  location?: string;
  start: Date;
  end: Date;
}) {
  const stamp = (d: Date) => d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const escape = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Appointment Scheduler//EN",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    `UID:${params.uid}`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${stamp(params.start)}`,
    `DTEND:${stamp(params.end)}`,
    `SUMMARY:${escape(params.title)}`,
    params.description ? `DESCRIPTION:${escape(params.description)}` : undefined,
    params.location ? `LOCATION:${escape(params.location)}` : undefined,
    "END:VEVENT",
    "END:VCALENDAR",
  ].filter(Boolean);

  return lines.join("\r\n");
}
