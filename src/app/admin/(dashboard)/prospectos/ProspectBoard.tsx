"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { Eye, ExternalLink, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn, formatMoney } from "@/lib/utils";
import { createProspect, deleteProspect, setProspectStatus, updateProspect } from "./actions";

export interface ProspectRow {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  sector: string | null;
  status: string;
  source: string | null;
  value: number | null;
  notes: string | null;
  businessId: string | null;
  businessName: string | null;
  businessSlug: string | null;
  demoViews: number;
  shareCount: number;
  nextFollowUpAt: string;
  lastContactedAt: string | null;
  createdAt: string;
}

/** The pipeline, in the order a deal actually moves through it. */
const STATUSES = [
  { value: "NUEVO", label: "Nuevo" },
  { value: "CONTACTADO", label: "Contactado" },
  { value: "DEMO_ENVIADA", label: "Demo enviada" },
  { value: "INTERESADO", label: "Interesado" },
  { value: "NEGOCIACION", label: "Negociación" },
  { value: "GANADO", label: "Ganado" },
  { value: "PERDIDO", label: "Perdido" },
] as const;

const EMPTY = {
  name: "",
  company: "",
  email: "",
  phone: "",
  city: "",
  sector: "",
  status: "NUEVO",
  source: "",
  value: "" as string,
  notes: "",
  businessId: "",
  nextFollowUpAt: "",
};

type Draft = typeof EMPTY;

export function ProspectBoard({
  prospects,
  businesses,
}: {
  prospects: ProspectRow[];
  businesses: { id: string; name: string; slug: string }[];
}) {
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [editing, setEditing] = useState<ProspectRow | null>(null);
  const [creating, setCreating] = useState(false);
  const [pending, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return prospects.filter((p) => {
      if (statusFilter && p.status !== statusFilter) return false;
      if (!q) return true;
      return [p.name, p.company, p.email, p.phone, p.city, p.sector, p.businessName]
        .filter(Boolean)
        .some((field) => field!.toLowerCase().includes(q));
    });
  }, [prospects, query, statusFilter]);

  const open = prospects.filter((p) => p.status !== "GANADO" && p.status !== "PERDIDO");
  const pipelineValue = open.reduce((sum, p) => sum + (p.value ?? 0), 0);
  const won = prospects.filter((p) => p.status === "GANADO");

  function move(id: string, status: string) {
    startTransition(async () => {
      try {
        await setProspectStatus(id, status);
        toast.success("Estado actualizado");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No pudimos actualizar el estado");
      }
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl">Prospectos</h1>
          <p className="text-sm text-muted-foreground">
            A quién le estás vendiendo, con qué demo y en qué punto va cada conversación.
          </p>
        </div>
        <Button variant="brand" size="sm" onClick={() => setCreating(true)}>
          <Plus className="h-3.5 w-3.5" /> Nuevo prospecto
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="En pipeline" value={String(open.length)} hint="Sin ganar ni perder" />
        <SummaryCard label="Valor en pipeline" value={formatMoney(pipelineValue) ?? "—"} hint="Suma de los abiertos" />
        <SummaryCard label="Ganados" value={String(won.length)} hint="Clientes cerrados" />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Buscar por nombre, empresa, ciudad o demo…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <button
          onClick={() => setStatusFilter("")}
          className={cn(
            "rounded-md border px-3 py-1.5 text-xs",
            statusFilter === "" ? "border-brand bg-brand-soft text-brand" : "border-border text-muted-foreground"
          )}
        >
          Todos
        </button>
        {STATUSES.map((s) => (
          <button
            key={s.value}
            onClick={() => setStatusFilter(s.value === statusFilter ? "" : s.value)}
            className={cn(
              "rounded-md border px-3 py-1.5 text-xs",
              statusFilter === s.value
                ? "border-brand bg-brand-soft text-brand"
                : "border-border text-muted-foreground"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="overflow-hidden rounded-lg border border-border bg-card">
        {filtered.length === 0 ? (
          <p className="px-5 py-12 text-center text-sm text-muted-foreground">
            {prospects.length === 0
              ? "Todavía no tienes prospectos. Agrega el primero y asígnale la demo que le vas a mostrar."
              : "Ningún prospecto coincide con esta búsqueda."}
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {filtered.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="truncate font-medium">{p.name}</span>
                    {p.company ? (
                      <span className="truncate text-sm text-muted-foreground">· {p.company}</span>
                    ) : null}
                    {p.value ? <Badge variant="outline">{formatMoney(p.value)}</Badge> : null}
                  </div>
                  <p className="truncate text-xs text-muted-foreground">
                    {[p.email, p.phone, p.city, p.sector].filter(Boolean).join(" · ") || "Sin datos de contacto"}
                  </p>
                </div>

                {p.businessSlug ? (
                  <div className="flex items-center gap-2 text-xs">
                    <Link
                      href={`/admin/negocios/${p.businessId}/editar`}
                      className="truncate text-brand hover:underline"
                    >
                      {p.businessName}
                    </Link>
                    <span className="flex items-center gap-1 text-muted-foreground">
                      <Eye className="h-3 w-3" /> {p.demoViews}
                    </span>
                    <Link href={`/${p.businessSlug}`} target="_blank" className="text-muted-foreground">
                      <ExternalLink className="h-3.5 w-3.5" />
                    </Link>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Sin demo asignada</span>
                )}

                <select
                  value={p.status}
                  disabled={pending}
                  onChange={(e) => move(p.id, e.target.value)}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {STATUSES.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>

                <Button variant="ghost" size="sm" onClick={() => setEditing(p)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  disabled={pending}
                  onClick={() => {
                    if (!window.confirm(`¿Borrar a ${p.name}? La demo asignada no se borra.`)) return;
                    startTransition(async () => {
                      try {
                        await deleteProspect(p.id);
                        toast.success("Prospecto borrado");
                      } catch {
                        toast.error("No pudimos borrar el prospecto");
                      }
                    });
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5 text-destructive" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <ProspectDialog
        open={creating || editing !== null}
        prospect={editing}
        businesses={businesses}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
      />
    </div>
  );
}

function SummaryCard({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="console-serif mt-1 text-2xl">{value}</p>
      <p className="text-[11px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function ProspectDialog({
  open,
  prospect,
  businesses,
  onClose,
}: {
  open: boolean;
  prospect: ProspectRow | null;
  businesses: { id: string; name: string; slug: string }[];
  onClose: () => void;
}) {
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [loadedFor, setLoadedFor] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  // Sync the form to whichever prospect the dialog was opened for, without an
  // effect: rendering for a different row is itself the signal to reload.
  const key = prospect?.id ?? "nuevo";
  if (open && loadedFor !== key) {
    setLoadedFor(key);
    setDraft(
      prospect
        ? {
            name: prospect.name,
            company: prospect.company ?? "",
            email: prospect.email ?? "",
            phone: prospect.phone ?? "",
            city: prospect.city ?? "",
            sector: prospect.sector ?? "",
            status: prospect.status,
            source: prospect.source ?? "",
            value: prospect.value ? String(prospect.value) : "",
            notes: prospect.notes ?? "",
            businessId: prospect.businessId ?? "",
            nextFollowUpAt: prospect.nextFollowUpAt,
          }
        : EMPTY
    );
  }
  if (!open && loadedFor !== null) setLoadedFor(null);

  function field<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft((d) => ({ ...d, [key]: value }));
  }

  function submit() {
    startTransition(async () => {
      try {
        const payload = { ...draft, value: draft.value === "" ? null : Number(draft.value) };
        if (prospect) await updateProspect(prospect.id, payload);
        else await createProspect(payload);
        toast.success(prospect ? "Prospecto actualizado" : "Prospecto creado");
        onClose();
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "No pudimos guardar el prospecto");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{prospect ? "Editar prospecto" : "Nuevo prospecto"}</DialogTitle>
          <DialogDescription>
            Asígnale la demo que le vas a mostrar para poder seguir cuántas veces la abrió.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-3 sm:grid-cols-2">
          <Row label="Nombre">
            <Input value={draft.name} onChange={(e) => field("name", e.target.value)} />
          </Row>
          <Row label="Empresa">
            <Input value={draft.company} onChange={(e) => field("company", e.target.value)} />
          </Row>
          <Row label="Correo">
            <Input value={draft.email} onChange={(e) => field("email", e.target.value)} />
          </Row>
          <Row label="Teléfono / WhatsApp">
            <Input value={draft.phone} onChange={(e) => field("phone", e.target.value)} />
          </Row>
          <Row label="Ciudad">
            <Input value={draft.city} onChange={(e) => field("city", e.target.value)} />
          </Row>
          <Row label="Sector">
            <Input value={draft.sector} onChange={(e) => field("sector", e.target.value)} />
          </Row>
          <Row label="Estado">
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.status}
              onChange={(e) => field("status", e.target.value)}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </Row>
          <Row label="Origen">
            <Input
              value={draft.source}
              placeholder="Apollo, referido, Instagram…"
              onChange={(e) => field("source", e.target.value)}
            />
          </Row>
          <Row label="Valor mensual (COP)">
            <Input
              type="number"
              min={0}
              value={draft.value}
              onChange={(e) => field("value", e.target.value)}
            />
          </Row>
          <Row label="Próximo seguimiento">
            <Input
              type="date"
              value={draft.nextFollowUpAt}
              onChange={(e) => field("nextFollowUpAt", e.target.value)}
            />
          </Row>
          <Row label="Demo asignada" full>
            <select
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              value={draft.businessId}
              onChange={(e) => field("businessId", e.target.value)}
            >
              <option value="">Sin demo asignada</option>
              {businesses.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} (/{b.slug})
                </option>
              ))}
            </select>
          </Row>
          <Row label="Notas" full>
            <Textarea rows={4} value={draft.notes} onChange={(e) => field("notes", e.target.value)} />
          </Row>
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="brand" size="sm" onClick={submit} disabled={pending}>
            {pending ? "Guardando…" : "Guardar"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Row({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
      <Label className="text-xs">{label}</Label>
      {children}
    </div>
  );
}
