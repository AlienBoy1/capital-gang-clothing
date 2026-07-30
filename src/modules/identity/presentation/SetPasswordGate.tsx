"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { PASSWORD_POLICY_MESSAGE } from "@/modules/identity/domain/entities";
import {
  setPasswordSchema,
  type SetPasswordInput,
} from "@/modules/identity/presentation/login.schema";
import { Button } from "@/shared/ui/components/Button";

export function SetPasswordGate() {
  const [needed, setNeeded] = useState(false);
  const [checking, setChecking] = useState(true);
  const [serverError, setServerError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const form = useForm<SetPasswordInput>({
    resolver: zodResolver(setPasswordSchema),
  });

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((user) => {
        setNeeded(Boolean(user?.mustSetPassword));
      })
      .finally(() => setChecking(false));
  }, []);

  async function onSubmit(data: SetPasswordInput) {
    setSaving(true);
    setServerError(null);
    try {
      const res = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        setServerError(body.message ?? "No se pudo guardar la contraseña");
        return;
      }
      setNeeded(false);
    } finally {
      setSaving(false);
    }
  }

  if (checking || !needed) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 sm:items-center">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="set-password-title"
        className="w-full max-w-md rounded-2xl border border-line bg-canvas p-6 shadow-soft sm:p-8"
      >
        <p className="section-label">Primer acceso</p>
        <h2 id="set-password-title" className="mt-2 font-display text-2xl font-semibold tracking-tight">
          Configura tu contraseña
        </h2>
        <p className="mt-2 text-sm text-muted">
          Antes de usar el panel, define tu contraseña. {PASSWORD_POLICY_MESSAGE}
        </p>

        <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
              Contraseña
            </label>
            <input
              type="password"
              autoComplete="new-password"
              className="input-field"
              {...form.register("password")}
            />
            {form.formState.errors.password && (
              <p className="text-xs text-danger">{form.formState.errors.password.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <label className="text-xs font-medium uppercase tracking-[0.16em] text-subtle">
              Confirmar contraseña
            </label>
            <input
              type="password"
              autoComplete="new-password"
              className="input-field"
              {...form.register("confirmPassword")}
            />
            {form.formState.errors.confirmPassword && (
              <p className="text-xs text-danger">{form.formState.errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="rounded-xl border border-line bg-elevated/60 px-3 py-2 text-xs text-muted">
            Requisitos: mayúscula, número y uno de estos caracteres especiales:{" "}
            <span className="font-semibold text-fg"># ! @ &apos; ?</span>
          </div>

          {serverError && <p className="text-xs text-danger">{serverError}</p>}

          <Button type="submit" className="w-full" size="lg" isLoading={saving}>
            Guardar contraseña
          </Button>
        </form>
      </div>
    </div>
  );
}
