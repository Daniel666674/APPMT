"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, KeyRound, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Account {
  email: string;
  name: string;
  isPlatformAdmin: boolean;
  active: boolean;
  business: { name: string; slug: string } | null;
}

/**
 * Two steps: prove you hold the setup key and see which accounts exist, then
 * set a new password on one of them. Splitting it that way matters because
 * the usual reason someone is locked out is that they don't remember which
 * email they used.
 */
export function RecoveryForm() {
  const [secret, setSecret] = useState("");
  const [accounts, setAccounts] = useState<Account[] | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<{ email: string; promoted: boolean } | null>(null);

  async function call(payload: Record<string, unknown>) {
    const res = await fetch("/api/recuperar", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ secret, ...payload }),
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(body.error ?? "Algo salió mal.");
    return body;
  }

  async function loadAccounts(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = await call({ action: "list" });
      setAccounts(body.accounts);
      if (body.accounts.length) setEmail(body.accounts[0].email);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setBusy(false);
    }
  }

  async function reset(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const body = await call({ action: "reset", email, password });
      setDone({ email: body.email, promoted: body.promoted });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo salió mal.");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <Check className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Listo, ya puedes entrar</h2>
          <p className="text-sm text-muted-foreground">
            La contraseña de <b>{done.email}</b> quedó cambiada.
            {done.promoted ? " Esta cuenta ahora también administra todas las agendas." : ""}
          </p>
        </div>
        <Button asChild variant="brand" className="w-full">
          <Link href="/admin/login">Entrar al panel</Link>
        </Button>
        <p className="text-xs text-muted-foreground">
          Cambia esta contraseña por una tuya en Mi cuenta apenas entres.
        </p>
      </div>
    );
  }

  if (!accounts) {
    return (
      <form onSubmit={loadAccounts} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="secret">Clave de instalación</Label>
          <Input
            id="secret"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="font-mono"
            autoFocus
            required
          />
          <p className="text-xs text-muted-foreground">
            Es el valor de <code className="rounded bg-secondary px-1 py-0.5">SETUP_SECRET</code> en las
            variables de entorno de este despliegue, en Vercel.
          </p>
        </div>
        {error ? <Message text={error} /> : null}
        <Button type="submit" variant="brand" className="w-full" disabled={busy}>
          {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <KeyRound className="mr-1 h-4 w-4" />}
          {busy ? "Revisando…" : "Ver mis cuentas"}
        </Button>
      </form>
    );
  }

  if (accounts.length === 0) {
    return (
      <div className="space-y-4 text-center">
        <h2 className="text-lg font-bold">Todavía no hay ninguna cuenta</h2>
        <p className="text-sm text-muted-foreground">
          Este despliegue no tiene usuarios, así que no hay nada que recuperar. Crea la primera agenda
          y con ella tu acceso.
        </p>
        <Button asChild variant="brand" className="w-full">
          <Link href="/setup">Crear la primera agenda</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={reset} className="space-y-5">
      <div className="space-y-2">
        <Label>¿Cuál cuenta?</Label>
        <div className="space-y-2">
          {accounts.map((account) => (
            <label
              key={account.email}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                email === account.email ? "border-brand bg-brand-soft" : "border-border hover:border-brand/50"
              }`}
            >
              <input
                type="radio"
                name="account"
                value={account.email}
                checked={email === account.email}
                onChange={() => setEmail(account.email)}
                className="mt-1"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium">{account.email}</span>
                <span className="block text-xs text-muted-foreground">
                  {account.isPlatformAdmin ? "Cuenta principal — administra todas las agendas" : null}
                  {!account.isPlatformAdmin && account.business
                    ? `Solo administra «${account.business.name}»`
                    : null}
                </span>
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="new-password">Nueva contraseña</Label>
        <Input
          id="new-password"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          required
        />
        <p className="text-xs text-muted-foreground">
          Se muestra mientras la escribes para que no quede duda de qué quedó guardado.
        </p>
      </div>

      {error ? <Message text={error} /> : null}

      <Button type="submit" variant="brand" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
        {busy ? "Guardando…" : "Cambiar la contraseña"}
      </Button>
    </form>
  );
}

function Message({ text }: { text: string }) {
  return (
    <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
      {text}
    </p>
  );
}
