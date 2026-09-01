"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

/**
 * Three fields. The superadmin runs every agenda, so nothing here asks about
 * a business — no sector, no name, no brand. That all belongs to the agendas
 * themselves, created afterwards from the console.
 */
export function SetupForm() {
  const [secret, setSecret] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  if (done) {
    return (
      <div className="space-y-5 text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-success">
          <Check className="h-7 w-7" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold">Tu cuenta ya está lista</h2>
          <p className="text-sm text-muted-foreground">
            Entra al panel y crea la biblioteca de demos con un clic.
          </p>
        </div>
        <Button asChild variant="brand" className="w-full">
          <Link href="/admin/login">Entrar al panel</Link>
        </Button>
      </div>
    );
  }

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const res = await fetch("/api/setup", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ secret, email, password }),
          });
          const body = await res.json().catch(() => ({}));
          if (!res.ok) setError(body.error ?? "No pudimos crear la cuenta.");
          else setDone(true);
        } catch {
          setError("No pudimos conectar con el servidor.");
        } finally {
          setBusy(false);
        }
      }}
    >
      <div className="space-y-1.5">
        <Label htmlFor="setup-email">Tu correo</Label>
        <Input
          id="setup-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
          required
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="setup-password">Tu contraseña</Label>
        <Input
          id="setup-password"
          type="text"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mínimo 8 caracteres"
          required
        />
        <p className="text-xs text-muted-foreground">Se muestra mientras la escribes. Anótala.</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="setup-secret">Clave de instalación</Label>
        <Input
          id="setup-secret"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="font-mono"
          required
        />
        <p className="text-xs text-muted-foreground">
          El valor de <code className="rounded bg-secondary px-1 py-0.5">SETUP_SECRET</code> en Vercel.
        </p>
      </div>

      {error ? (
        <p className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <Button type="submit" variant="brand" className="w-full" disabled={busy}>
        {busy ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : null}
        {busy ? "Creando…" : "Crear mi cuenta"}
      </Button>
    </form>
  );
}
