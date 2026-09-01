"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  CalendarDays,
  ExternalLink,
  LayoutDashboard,
  LogOut,
  Menu,
  Scissors,
  Settings,
  Store,
  UserCog,
  Users,
  UserSquare2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/admin/actions";

const NAV_ITEMS = [
  { href: "/admin", label: "Inicio", icon: LayoutDashboard, exact: true },
  { href: "/admin/appointments", label: "Citas", icon: CalendarDays },
  { href: "/admin/services", label: "Servicios", icon: Scissors },
  { href: "/admin/staff", label: "Equipo", icon: UserSquare2 },
  { href: "/admin/customers", label: "Clientes", icon: Users },
  { href: "/admin/settings", label: "Configuración", icon: Settings },
  { href: "/admin/cuenta", label: "Mi cuenta", icon: UserCog },
];

/** Only a platform admin sees this — it reaches across every business. */
const PLATFORM_NAV = { href: "/admin/negocios", label: "Mis agendas", icon: Store };

export function AdminShell({
  businessName,
  businessSlug,
  logoUrl,
  userName,
  isPlatformAdmin = false,
  agendaCount = 0,
  children,
}: {
  businessName: string | null;
  businessSlug: string | null;
  logoUrl?: string | null;
  userName: string;
  isPlatformAdmin?: boolean;
  agendaCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const linkClass = (active: boolean) =>
    cn(
      "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
      active ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:bg-secondary hover:text-foreground"
    );

  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {isPlatformAdmin ? (
        <>
          <Link
            href={PLATFORM_NAV.href}
            onClick={() => setMobileOpen(false)}
            className={linkClass(pathname.startsWith(PLATFORM_NAV.href))}
          >
            <PLATFORM_NAV.icon className="h-4 w-4" />
            {PLATFORM_NAV.label}
            {agendaCount ? (
              <span className="ml-auto rounded-full bg-secondary px-1.5 text-xs text-muted-foreground">
                {agendaCount}
              </span>
            ) : null}
          </Link>
          {businessName ? (
            <p className="mt-3 px-3 pb-1 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Editando: {businessName}
            </p>
          ) : null}
        </>
      ) : null}
      {(businessSlug ? NAV_ITEMS : []).map((item) => {
        const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={() => setMobileOpen(false)}
            className={linkClass(active)}
          >
            <Icon className="h-4 w-4" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="flex min-h-screen">
      <aside className="hidden w-64 shrink-0 flex-col border-r border-border bg-card py-6 md:flex">
        <div className="mb-6 flex items-center gap-2 px-4">
          {logoUrl && businessName ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt={businessName} className="h-8 w-auto object-contain" />
          ) : (
            <span className="truncate text-lg font-bold text-brand">{businessName ?? "Mis agendas"}</span>
          )}
        </div>
        {nav}
        <div className="mt-auto space-y-2 px-4 pt-6">
          {businessSlug ? (
            <Link
              href={`/${businessSlug}`}
              target="_blank"
              className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="h-3.5 w-3.5" /> Ver esta página de reservas
            </Link>
          ) : null}
          <p className="truncate text-xs text-muted-foreground">Sesión de {userName}</p>
          <form action={logout}>
            <Button type="submit" variant="outline" size="sm" className="w-full">
              <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
            </Button>
          </form>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative z-50 flex w-64 flex-col bg-card py-6">
            <div className="mb-6 flex items-center justify-between px-4">
              <span className="truncate text-lg font-bold text-brand">{businessName}</span>
              <button onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
                <X className="h-5 w-5" />
              </button>
            </div>
            {nav}
            <div className="mt-auto space-y-2 px-4 pt-6">
              <form action={logout}>
                <Button type="submit" variant="outline" size="sm" className="w-full">
                  <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
                </Button>
              </form>
            </div>
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between border-b border-border bg-card px-4 py-3 md:hidden">
          <span className="font-bold text-brand">{businessName}</span>
          <button onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </button>
        </header>
        <main className="flex-1 bg-secondary/30 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
