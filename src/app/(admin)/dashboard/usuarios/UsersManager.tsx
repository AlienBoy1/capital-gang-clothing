"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/components/Button";
import { Copy, Check } from "lucide-react";

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: string;
  isActive: boolean;
  isValidated?: boolean;
  mustSetPassword?: boolean;
}

interface CreatedCredentials {
  accessCode: string;
  name: string;
  email: string;
}

export function UsersManager() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<CreatedCredentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    email: "",
    role: "USER" as "ADMIN" | "USER",
  });

  async function loadUsers() {
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message ?? "No se pudo crear el usuario");
      setSaving(false);
      return;
    }

    setCreated({
      accessCode: data.accessCode,
      name: `${form.firstName} ${form.lastName}`.trim(),
      email: form.email,
    });
    setForm({ firstName: "", lastName: "", phone: "", email: "", role: "USER" });
    await loadUsers();
    setSaving(false);
  }

  async function copyCode() {
    if (!created) return;
    await navigator.clipboard.writeText(created.accessCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="panel space-y-4">
        <p className="text-sm text-muted">
          Al crear un usuario se genera un <strong className="text-fg">código de acceso</strong> de un
          solo uso. El usuario inicia sesión con su correo y ese código; luego configura su contraseña.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={form.firstName}
            onChange={(e) => setForm({ ...form, firstName: e.target.value })}
            placeholder="Nombre"
            required
            className="input-field"
          />
          <input
            value={form.lastName}
            onChange={(e) => setForm({ ...form, lastName: e.target.value })}
            placeholder="Apellido"
            required
            className="input-field"
          />
          <input
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="Teléfono"
            required
            className="input-field"
          />
          <input
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="Correo"
            type="email"
            required
            className="input-field"
          />
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as "ADMIN" | "USER" })}
            className="input-field"
          >
            <option value="USER">Usuario</option>
            <option value="ADMIN">Administrador</option>
          </select>
        </div>
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" isLoading={saving}>
          Crear usuario
        </Button>
      </form>

      {created && (
        <div className="panel border-brand/40 bg-brand-soft/30 space-y-3">
          <p className="section-label">Usuario creado</p>
          <h3 className="font-display text-xl font-semibold">{created.name}</h3>
          <p className="text-sm text-muted">{created.email}</p>
          <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
            <div>
              <p className="text-xs uppercase tracking-[0.16em] text-subtle">Código de acceso</p>
              <p className="mt-1 font-brand text-3xl font-bold tracking-[0.2em] text-brand">
                {created.accessCode}
              </p>
            </div>
            <button
              type="button"
              onClick={copyCode}
              className="ml-auto inline-flex items-center gap-2 rounded-full border border-line bg-elevated px-4 py-2 text-sm font-medium text-fg"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
          <p className="text-xs text-subtle">
            Compártelo solo una vez. No se podrá volver a consultar desde el panel.
          </p>
          <Button type="button" variant="ghost" onClick={() => setCreated(null)}>
            Cerrar
          </Button>
        </div>
      )}

      <div className="grid gap-3">
        {users.map((user) => (
          <div key={user.id} className="panel">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-semibold text-fg">
                  {user.firstName} {user.lastName}
                </h3>
                <p className="text-sm text-muted">{user.email}</p>
              </div>
              <div className="text-right text-sm text-muted">
                <p>{user.role}</p>
                <p className={user.isActive ? "text-brand" : "text-danger"}>
                  {user.isActive ? "Activo" : "Inactivo"}
                </p>
                {user.mustSetPassword && (
                  <p className="text-xs text-amber-400">Pendiente de contraseña</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
