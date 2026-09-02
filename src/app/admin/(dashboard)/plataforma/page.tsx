import Link from "next/link";
import { AlertTriangle, KeyRound, Mail, ShieldCheck } from "lucide-react";
import { requirePlatformAdmin } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { getPlatformSettings } from "@/lib/platform-settings";
import { formatMoney } from "@/lib/utils";
import { PlatformForm } from "./PlatformForm";

export const dynamic = "force-dynamic";

/**
 * The console's own settings — mine, not a client's. Business-level settings
 * (brand, hours, booking rules) live inside each agenda; what belongs here is
 * everything that spans the deployment.
 */
export default async function PlataformaPage() {
  await requirePlatformAdmin();

  const [settings, agendas, demos, prospects, bookings, admins] = await Promise.all([
    getPlatformSettings(),
    prisma.business.count(),
    prisma.business.count({ where: { users: { none: {} } } }),
    prisma.prospect.count(),
    prisma.booking.count(),
    prisma.user.findMany({
      where: { isPlatformAdmin: true },
      select: { id: true, name: true, email: true, active: true, createdAt: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const monthly = settings.monthlyPrice ? Number(settings.monthlyPrice) : null;

  // What the console can and cannot do right now, stated plainly instead of
  // discovered mid-call. Each line is a real capability check, not a wish.
  const capabilities = [
    {
      label: "Envío de correos (Resend)",
      ok: Boolean(process.env.RESEND_API_KEY),
      detail: process.env.RESEND_API_KEY
        ? "Confirmaciones, recordatorios y cancelaciones se envían de verdad."
        : "Sin RESEND_API_KEY los correos solo se registran en el log. Nada se rompe, pero nadie recibe nada.",
    },
    {
      label: "Recordatorios automáticos",
      ok: Boolean(process.env.CRON_SECRET),
      detail:
        "Corren una vez al día (08:00 Bogotá) y barren una ventana de 36 horas: cada cita recibe un recordatorio, entre 12 y 36 horas antes.",
    },
    {
      label: "Subida de archivos",
      ok: false,
      detail: "Logos, favicons e imágenes de portada todavía se pegan como URL.",
    },
    {
      label: "WhatsApp transaccional",
      ok: false,
      detail: "Hoy WhatsApp es solo el botón flotante de la página pública.",
    },
    {
      label: "Pagos y depósitos",
      ok: false,
      detail: "Sin cobros en línea. Wompi, Bold o Mercado Pago serían el paso.",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl">Configuración de la plataforma</h1>
        <p className="text-sm text-muted-foreground">
          Lo que aplica a todo el despliegue. Los ajustes de cada agenda están dentro de la agenda.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Agendas" value={String(agendas)} hint={`${demos} sin login propio`} />
        <Metric label="Prospectos" value={String(prospects)} hint="En el CRM" />
        <Metric label="Citas totales" value={String(bookings)} hint="En todas las agendas" />
        <Metric
          label="Ingreso mensual potencial"
          value={monthly ? (formatMoney(monthly * agendas) ?? "—") : "—"}
          hint={monthly ? `${formatMoney(monthly)} × ${agendas} agendas` : "Define el precio mensual abajo"}
        />
      </div>

      <PlatformForm
        initial={{
          resellerName: settings.resellerName,
          resellerWhatsapp: settings.resellerWhatsapp,
          publicDirectoryTitle: settings.publicDirectoryTitle,
          publicDirectorySubtitle: settings.publicDirectorySubtitle,
          defaultCity: settings.defaultCity,
          monthlyPrice: settings.monthlyPrice,
          setupPrice: settings.setupPrice,
        }}
      />

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-base">Qué puede hacer este despliegue hoy</h2>
        </div>
        <ul className="divide-y divide-border">
          {capabilities.map((c) => (
            <li key={c.label} className="flex items-start gap-3 px-5 py-3">
              {c.ok ? (
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-[var(--success)]" />
              ) : (
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              )}
              <span className="min-w-0">
                <span className="block text-sm font-medium">{c.label}</span>
                <span className="block text-xs text-muted-foreground">{c.detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <section className="rounded-lg border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h2 className="text-base">Acceso de superadministrador</h2>
          <p className="text-xs text-muted-foreground">
            Estas cuentas alcanzan todas las agendas. Se verifica contra la base de datos en cada
            petición, nunca contra la cookie.
          </p>
        </div>
        <ul className="divide-y divide-border">
          {admins.map((admin) => (
            <li key={admin.id} className="flex flex-wrap items-center gap-3 px-5 py-3">
              <Mail className="h-4 w-4 shrink-0 text-muted-foreground" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{admin.name}</span>
                <span className="block truncate text-xs text-muted-foreground">{admin.email}</span>
              </span>
              <span className="text-xs text-muted-foreground">{admin.active ? "Activa" : "Inactiva"}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-4 border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <Link href="/admin/cuenta" className="flex items-center gap-1.5 text-brand hover:underline">
            <KeyRound className="h-3.5 w-3.5" /> Cambiar mi contraseña
          </Link>
          <span>
            ¿Bloqueado? <span className="font-mono">/recuperar</span> con el SETUP_SECRET restablece el
            acceso.
          </span>
        </div>
      </section>
    </div>
  );
}

function Metric({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="console-serif mt-1 text-2xl">{value}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}
