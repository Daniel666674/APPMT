"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Building2,
  CalendarDays,
  ChevronsUpDown,
  ExternalLink,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Palette,
  Scissors,
  Settings,
  SlidersHorizontal,
  Users,
  UserSquare2,
  X,
} from "lucide-react";
import { cn, initials } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/admin/actions";

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  exact?: boolean;
  badge?: number;
}

interface NavGroup {
  label: string;
  items: NavItem[];
}

/**
 * The console's navigation, grouped the way the work is grouped: what I run,
 * who I'm selling to, and the agenda I currently have open. A business owner
 * signing in at /<slug>/admin never sees the first two groups — they only
 * ever get the agenda group, for their own agenda.
 */
function buildNav(opts: {
  isPlatformAdmin: boolean;
  hasBusiness: boolean;
  agendaCount: number;
  prospectCount: number;
}): NavGroup[] {
  const groups: NavGroup[] = [];

  if (opts.isPlatformAdmin) {
    groups.push({
      label: "Plataforma",
      items: [
        { href: "/admin/negocios", label: "Demos", icon: Library, badge: opts.agendaCount || undefined },
        { href: "/admin/prospectos", label: "Prospectos", icon: Users, badge: opts.prospectCount || undefined },
        { href: "/admin/plataforma", label: "Configuración", icon: SlidersHorizontal },
      ],
    });
  }

  if (opts.hasBusiness) {
    groups.push({
      label: "Agenda abierta",
      items: [
        { href: "/admin", label: "Resumen", icon: LayoutDashboard, exact: true },
        { href: "/admin/appointments", label: "Citas", icon: CalendarDays },
        { href: "/admin/services", label: "Servicios", icon: Scissors },
        { href: "/admin/staff", label: "Equipo", icon: UserSquare2 },
        { href: "/admin/customers", label: "Clientes", icon: Building2 },
        { href: "/admin/settings", label: "Ajustes y marca", icon: Palette },
      ],
    });
  }

  groups.push({
    label: "Cuenta",
    items: [{ href: "/admin/cuenta", label: "Mi cuenta", icon: Settings }],
  });

  return groups;
}

export function AdminShell({
  businessName,
  businessSlug,
  logoUrl,
  userName,
  isPlatformAdmin = false,
  agendaCount = 0,
  prospectCount = 0,
  children,
}: {
  businessName: string | null;
  businessSlug: string | null;
  logoUrl?: string | null;
  userName: string;
  isPlatformAdmin?: boolean;
  agendaCount?: number;
  prospectCount?: number;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  // Radix portals mount on <body>, outside this subtree, so the console's
  // palette is flagged there too — otherwise every dialog and dropdown would
  // render in the neutral light theme the public pages use.
  useEffect(() => {
    document.body.dataset.console = "1";
    return () => {
      delete document.body.dataset.console;
    };
  }, []);

  const groups = buildNav({
    isPlatformAdmin,
    hasBusiness: Boolean(businessSlug),
    agendaCount,
    prospectCount,
  });

  const isActive = (item: NavItem) =>
    item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);

  const nav = (
    <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-2">
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active = isActive(item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "group flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-brand-soft font-medium text-brand"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
                {item.badge ? (
                  <span className="ml-auto rounded-full bg-secondary px-1.5 text-[11px] tabular-nums text-muted-foreground">
                    {item.badge}
                  </span>
                ) : null}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  const brandMark = (
    <Link href={isPlatformAdmin ? "/admin/negocios" : "/admin"} className="flex items-center gap-2.5 px-4">
      <span
        className="grid h-9 w-9 place-items-center rounded-md border text-base font-bold"
        style={{ borderColor: "var(--console-gold)", color: "var(--console-gold)" }}
      >
        B
      </span>
      <span className="leading-tight">
        <span className="console-serif block text-[15px] font-semibold tracking-wide">NEXUS</span>
        <span className="block text-[9px] uppercase tracking-[0.22em] text-muted-foreground">
          by BlackScale
        </span>
      </span>
    </Link>
  );

  const footer = (
    <div className="mt-auto space-y-3 border-t border-border px-3 pt-4">
      {businessSlug ? (
        <div className="flex items-center gap-2 px-1">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={logoUrl} alt="" className="h-5 w-5 rounded object-contain" />
          ) : null}
          <span className="truncate text-xs text-muted-foreground">{businessName}</span>
        </div>
      ) : null}
      {businessSlug ? (
        <Link
          href={`/${businessSlug}`}
          target="_blank"
          className="flex items-center gap-2 px-1 text-xs text-muted-foreground transition-colors hover:text-brand"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Ver /{businessSlug}
        </Link>
      ) : null}
      <div className="flex items-center gap-2.5 rounded-md bg-secondary/60 px-2.5 py-2">
        <span
          className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-[11px] font-semibold"
          style={{ background: "var(--console-burgundy)", color: "#f7f2ea" }}
        >
          {initials(userName) || "?"}
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block truncate text-xs font-medium">{userName}</span>
          <span className="block truncate text-[10px] text-muted-foreground">
            {isPlatformAdmin ? "Super administrador" : businessName ?? "Cuenta"}
          </span>
        </span>
        <ChevronsUpDown className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      </div>
      <form action={logout}>
        <Button type="submit" variant="outline" size="sm" className="w-full">
          <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
        </Button>
      </form>
    </div>
  );

  return (
    <div className="console flex min-h-screen">
      <aside
        className="hidden w-60 shrink-0 flex-col border-r border-border py-5 md:flex"
        style={{ background: "var(--console-sidebar)" }}
      >
        {brandMark}
        <div className="mt-6 flex flex-1 flex-col">{nav}</div>
        {footer}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 flex md:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <aside
            className="relative z-50 flex w-64 flex-col py-5"
            style={{ background: "var(--console-sidebar)" }}
          >
            <div className="flex items-center justify-between pr-4">
              {brandMark}
              <button onClick={() => setMobileOpen(false)} aria-label="Cerrar menú">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="mt-6 flex flex-1 flex-col">{nav}</div>
            {footer}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col bg-background">
        <header className="flex items-center justify-between border-b border-border px-4 py-3 md:hidden">
          <span className="console-serif font-semibold">{businessName ?? "NEXUS"}</span>
          <button onClick={() => setMobileOpen(true)} aria-label="Abrir menú">
            <Menu className="h-5 w-5" />
          </button>
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
