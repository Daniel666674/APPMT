import "server-only";
import { render } from "@react-email/render";
import { Resend } from "resend";
import { BookingCancelledEmail } from "@/emails/BookingCancelled";
import { BookingConfirmationEmail } from "@/emails/BookingConfirmation";
import { BookingReminderEmail } from "@/emails/BookingReminder";
import { NewBookingNoticeEmail } from "@/emails/NewBookingNotice";
import { buildIcsEvent } from "@/lib/ics";

function getResendClient() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

interface SendArgs {
  to: string;
  subject: string;
  react: React.ReactElement;
  attachments?: { filename: string; content: string }[];
}

async function send({ to, subject, react, attachments }: SendArgs) {
  const resend = getResendClient();
  const from = process.env.EMAIL_FROM ?? "Appointment Scheduler <onboarding@resend.dev>";
  const html = await render(react);

  if (!resend) {
    // No email provider configured yet — don't crash the booking flow,
    // just log so local/demo use still works end to end.
    console.info(`[email] RESEND_API_KEY not set. Would send "${subject}" to ${to}`);
    return;
  }

  await resend.emails.send({
    from,
    to,
    subject,
    html,
    attachments: attachments?.map((a) => ({ filename: a.filename, content: a.content })),
  });
}

interface BookingEmailContext {
  businessName: string;
  logoUrl?: string | null;
  primaryColor: string;
  customerName: string;
  customerEmail: string;
  serviceName: string;
  staffName: string;
  dateLabel: string;
  timeLabel: string;
  start: Date;
  end: Date;
  manageUrl: string;
  location?: string;
}

export async function sendBookingConfirmationEmail(ctx: BookingEmailContext) {
  const ics = buildIcsEvent({
    uid: `${ctx.manageUrl}`,
    title: `${ctx.serviceName} — ${ctx.businessName}`,
    description: `Tu cita con ${ctx.staffName}.`,
    location: ctx.location,
    start: ctx.start,
    end: ctx.end,
  });

  await send({
    to: ctx.customerEmail,
    subject: `Confirmada: ${ctx.serviceName} el ${ctx.dateLabel}`,
    react: BookingConfirmationEmail({
      businessName: ctx.businessName,
      logoUrl: ctx.logoUrl,
      primaryColor: ctx.primaryColor,
      customerName: ctx.customerName,
      serviceName: ctx.serviceName,
      staffName: ctx.staffName,
      dateLabel: ctx.dateLabel,
      timeLabel: ctx.timeLabel,
      manageUrl: ctx.manageUrl,
    }),
    attachments: [{ filename: "cita.ics", content: Buffer.from(ics).toString("base64") }],
  });
}

export async function sendBookingCancelledEmail(
  ctx: Omit<BookingEmailContext, "start" | "end" | "manageUrl"> & { bookAgainUrl: string }
) {
  await send({
    to: ctx.customerEmail,
    subject: `Cancelada: ${ctx.serviceName} el ${ctx.dateLabel}`,
    react: BookingCancelledEmail({
      businessName: ctx.businessName,
      logoUrl: ctx.logoUrl,
      primaryColor: ctx.primaryColor,
      customerName: ctx.customerName,
      serviceName: ctx.serviceName,
      dateLabel: ctx.dateLabel,
      timeLabel: ctx.timeLabel,
      bookAgainUrl: ctx.bookAgainUrl,
    }),
  });
}

export async function sendBookingReminderEmail(ctx: BookingEmailContext) {
  await send({
    to: ctx.customerEmail,
    subject: `Recordatorio: ${ctx.serviceName} mañana`,
    react: BookingReminderEmail({
      businessName: ctx.businessName,
      logoUrl: ctx.logoUrl,
      primaryColor: ctx.primaryColor,
      customerName: ctx.customerName,
      serviceName: ctx.serviceName,
      staffName: ctx.staffName,
      dateLabel: ctx.dateLabel,
      timeLabel: ctx.timeLabel,
      manageUrl: ctx.manageUrl,
    }),
  });
}

export async function sendNewBookingNoticeEmail(
  ctx: BookingEmailContext & { ownerEmail: string; customerPhone?: string | null; adminUrl: string }
) {
  await send({
    to: ctx.ownerEmail,
    subject: `Nueva reserva: ${ctx.customerName} — ${ctx.serviceName}`,
    react: NewBookingNoticeEmail({
      businessName: ctx.businessName,
      logoUrl: ctx.logoUrl,
      primaryColor: ctx.primaryColor,
      serviceName: ctx.serviceName,
      staffName: ctx.staffName,
      customerName: ctx.customerName,
      customerEmail: ctx.customerEmail,
      customerPhone: ctx.customerPhone,
      dateLabel: ctx.dateLabel,
      timeLabel: ctx.timeLabel,
      adminUrl: ctx.adminUrl,
    }),
  });
}
