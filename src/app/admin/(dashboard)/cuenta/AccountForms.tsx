"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateAccountPassword, updateAccountProfile } from "./actions";

export function ProfileForm({ initial }: { initial: { name: string; email: string } }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          await updateAccountProfile(values);
          toast.success("Datos guardados");
          router.refresh();
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "No pudimos guardar");
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="account-name">Tu nombre</Label>
          <Input
            id="account-name"
            value={values.name}
            onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="account-email">Correo para entrar</Label>
          <Input
            id="account-email"
            type="email"
            value={values.email}
            onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            required
          />
          <p className="text-xs text-muted-foreground">Con este correo inicias sesión.</p>
        </div>
      </div>
      <Button type="submit" variant="brand" disabled={saving}>
        {saving ? "Guardando…" : "Guardar datos"}
      </Button>
    </form>
  );
}

export function PasswordForm() {
  const empty = { currentPassword: "", newPassword: "", confirmPassword: "" };
  const [values, setValues] = useState(empty);
  const [saving, setSaving] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
          await updateAccountPassword(values);
          setValues(empty);
          toast.success("Contraseña actualizada");
        } catch (err) {
          toast.error(err instanceof Error ? err.message : "No pudimos cambiarla");
        } finally {
          setSaving(false);
        }
      }}
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="pw-current">Contraseña actual</Label>
          <Input
            id="pw-current"
            type="password"
            autoComplete="current-password"
            value={values.currentPassword}
            onChange={(e) => setValues((v) => ({ ...v, currentPassword: e.target.value }))}
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw-new">Nueva contraseña</Label>
          <Input
            id="pw-new"
            type="password"
            autoComplete="new-password"
            value={values.newPassword}
            onChange={(e) => setValues((v) => ({ ...v, newPassword: e.target.value }))}
            required
          />
          <p className="text-xs text-muted-foreground">Mínimo 8 caracteres.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="pw-confirm">Repite la nueva</Label>
          <Input
            id="pw-confirm"
            type="password"
            autoComplete="new-password"
            value={values.confirmPassword}
            onChange={(e) => setValues((v) => ({ ...v, confirmPassword: e.target.value }))}
            required
          />
        </div>
      </div>
      <Button type="submit" variant="brand" disabled={saving}>
        {saving ? "Guardando…" : "Cambiar contraseña"}
      </Button>
    </form>
  );
}
