"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Check, Copy, Eye, Pencil, Search, Trash2, UserPlus, X } from "lucide-react";
import { Button } from "@/shared/ui/components/Button";
import { cn } from "@/shared/lib/cn";

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string;
  role: "ADMIN" | "USER" | string;
  isActive: boolean;
  isValidated?: boolean;
  mustSetPassword?: boolean;
  accessCodePlain?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface CreatedCredentials {
  accessCode: string;
  name: string;
  email: string;
}

const emptyForm = {
  firstName: "",
  lastName: "",
  phone: "",
  email: "",
  role: "USER" as "ADMIN" | "USER",
  isActive: true,
};

type Mode = "create" | "edit";

function formatDate(value?: string) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("es-MX", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function UsersManager() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [mode, setMode] = useState<Mode>("create");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [viewing, setViewing] = useState<UserItem | null>(null);
  const [created, setCreated] = useState<CreatedCredentials | null>(null);
  const [copied, setCopied] = useState(false);
  const [detailCopied, setDetailCopied] = useState(false);
  const [deleting, setDeleting] = useState<UserItem | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/users");
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter((user) => {
      const haystack = [
        user.firstName,
        user.lastName,
        user.email,
        user.phone,
        user.role,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }, [users, query]);

  function resetForm() {
    setMode("create");
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  function startEdit(user: UserItem) {
    setMode("edit");
    setEditingId(user.id);
    setCreated(null);
    setViewing(null);
    setForm({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      email: user.email ?? "",
      role: user.role === "ADMIN" ? "ADMIN" : "USER",
      isActive: user.isActive,
    });
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (mode === "create") {
        const res = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: form.firstName,
            lastName: form.lastName,
            phone: form.phone,
            email: form.email,
            role: form.role,
          }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          setError(data.message ?? "No se pudo crear el usuario");
          return;
        }
        setCreated({
          accessCode: data.accessCode,
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email,
        });
        resetForm();
        await loadUsers();
        return;
      }

      if (!editingId) return;
      const res = await fetch(`/api/users/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "No se pudo actualizar el usuario");
        return;
      }
      resetForm();
      await loadUsers();
    } finally {
      setSaving(false);
    }
  }

  function requestDelete(user: UserItem) {
    setDeleting(user);
    setError(null);
  }

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${deleting.id}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "No se pudo eliminar el usuario");
        return;
      }
      if (editingId === deleting.id) resetForm();
      if (viewing?.id === deleting.id) setViewing(null);
      setDeleting(null);
      await loadUsers();
    } finally {
      setDeleteBusy(false);
    }
  }

  async function toggleActive(user: UserItem) {
    setError(null);
    const res = await fetch(`/api/users/${user.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !user.isActive }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.message ?? "No se pudo cambiar el estado");
      return;
    }
    await loadUsers();
    if (viewing?.id === user.id) {
      setViewing({ ...user, isActive: !user.isActive });
    }
  }

  async function copyCode() {
    if (!created) return;
    await navigator.clipboard.writeText(created.accessCode);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1600);
  }

  async function copyDetailCode(code: string) {
    await navigator.clipboard.writeText(code);
    setDetailCopied(true);
    window.setTimeout(() => setDetailCopied(false), 1600);
  }

  async function openDetail(user: UserItem) {
    const res = await fetch(`/api/users/${user.id}`);
    if (res.ok) {
      setViewing(await res.json());
    } else {
      setViewing(user);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="panel space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-fg">
              {mode === "create" ? "Nuevo usuario" : "Editar usuario"}
            </p>
            <p className="mt-1 text-sm text-muted">
              {mode === "create"
                ? "Al crear se genera un código de acceso de un solo uso."
                : "Actualiza los datos del usuario seleccionado."}
            </p>
          </div>
          {mode === "edit" && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted transition hover:text-fg"
            >
              <X size={14} />
              Cancelar edición
            </button>
          )}
        </div>

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
          {mode === "edit" && (
            <label className="flex items-center gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={form.isActive}
                onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              />
              Cuenta activa
            </label>
          )}
        </div>

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" isLoading={saving}>
          {mode === "create" ? (
            <>
              <UserPlus size={16} className="mr-1.5" />
              Crear usuario
            </>
          ) : (
            "Guardar cambios"
          )}
        </Button>
      </form>

      {created && (
        <div className="panel space-y-3 border-brand/40 bg-brand-soft/30">
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
            También puedes consultarlo después en el detalle del usuario, hasta que complete su primer
            acceso y configure su contraseña.
          </p>
          <Button type="button" variant="ghost" onClick={() => setCreated(null)}>
            Cerrar
          </Button>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-display text-lg font-semibold">
            Equipo ({filtered.length}
            {query ? ` / ${users.length}` : ""})
          </h2>
          <div className="relative w-full sm:max-w-xs">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar por nombre, correo, teléfono…"
              className="input-field pl-9"
            />
          </div>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="skeleton h-24" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-sm text-muted">
            {query ? "No hay coincidencias con esa búsqueda." : "Aún no hay usuarios registrados."}
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map((user) => {
              const isEditing = editingId === user.id;
              return (
                <div
                  key={user.id}
                  className={cn(
                    "panel",
                    isEditing && "border-brand/50 ring-1 ring-brand/30"
                  )}
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-semibold text-fg">
                        {user.firstName} {user.lastName}
                      </h3>
                      <p className="mt-1 text-sm text-muted">{user.email}</p>
                      <p className="mt-1 text-xs text-subtle">{user.phone}</p>
                      <div className="mt-3 flex flex-wrap gap-2 text-[0.65rem] uppercase tracking-[0.12em]">
                        <span className="rounded-full bg-elevated px-2.5 py-1 text-fg">
                          {user.role === "ADMIN" ? "Admin" : "Usuario"}
                        </span>
                        <span
                          className={cn(
                            "rounded-full px-2.5 py-1",
                            user.isActive
                              ? "bg-brand-soft text-brand"
                              : "bg-danger/15 text-danger"
                          )}
                        >
                          {user.isActive ? "Activo" : "Inactivo"}
                        </span>
                        {!user.isValidated && (
                          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-400">
                            Sin validar
                          </span>
                        )}
                        {user.mustSetPassword && (
                          <span className="rounded-full bg-amber-500/15 px-2.5 py-1 text-amber-400">
                            Pendiente contraseña
                          </span>
                        )}
                        {user.accessCodePlain && (
                          <span className="rounded-full bg-brand-soft px-2.5 py-1 font-mono tracking-widest text-brand">
                            Código {user.accessCodePlain}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => openDetail(user)}
                        className="rounded-lg p-2 text-muted transition hover:bg-elevated hover:text-fg"
                        aria-label="Ver detalle"
                        title="Ver"
                      >
                        <Eye size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(user)}
                        className="rounded-lg p-2 text-muted transition hover:bg-elevated hover:text-brand"
                        aria-label="Editar"
                        title="Editar"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleActive(user)}
                        className="rounded-lg px-2.5 py-2 text-xs font-medium text-muted transition hover:bg-elevated hover:text-fg"
                        title={user.isActive ? "Desactivar" : "Activar"}
                      >
                        {user.isActive ? "Desactivar" : "Activar"}
                      </button>
                      <button
                        type="button"
                        onClick={() => requestDelete(user)}
                        className="rounded-lg p-2 text-muted transition hover:bg-elevated hover:text-danger"
                        aria-label="Eliminar"
                        title="Eliminar"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {viewing && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-lg rounded-2xl border border-line bg-canvas p-6 shadow-soft"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="section-label">Detalle</p>
                <h3 className="mt-1 font-display text-2xl font-semibold">
                  {viewing.firstName} {viewing.lastName}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewing(null)}
                className="rounded-full border border-line p-2 text-muted hover:text-fg"
                aria-label="Cerrar"
              >
                <X size={16} />
              </button>
            </div>

            <dl className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-subtle">Correo</dt>
                <dd className="mt-1 text-fg">{viewing.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-subtle">Teléfono</dt>
                <dd className="mt-1 text-fg">{viewing.phone}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-subtle">Rol</dt>
                <dd className="mt-1 text-fg">{viewing.role === "ADMIN" ? "Administrador" : "Usuario"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-subtle">Estado</dt>
                <dd className={cn("mt-1", viewing.isActive ? "text-brand" : "text-danger")}>
                  {viewing.isActive ? "Activo" : "Inactivo"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-subtle">Validación</dt>
                <dd className="mt-1 text-fg">
                  {viewing.isValidated ? "Código usado" : "Pendiente de código"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-subtle">Contraseña</dt>
                <dd className="mt-1 text-fg">
                  {viewing.mustSetPassword ? "Pendiente de configurar" : "Configurada"}
                </dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-subtle">Creado</dt>
                <dd className="mt-1 text-fg">{formatDate(viewing.createdAt)}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-[0.14em] text-subtle">Actualizado</dt>
                <dd className="mt-1 text-fg">{formatDate(viewing.updatedAt)}</dd>
              </div>
            </dl>

            {viewing.accessCodePlain ? (
              <div className="mt-5 rounded-xl border border-brand/30 bg-brand-soft/25 px-4 py-3">
                <p className="text-xs uppercase tracking-[0.16em] text-subtle">Código de acceso</p>
                <div className="mt-2 flex flex-wrap items-center gap-3">
                  <p className="font-brand text-3xl font-bold tracking-[0.2em] text-brand">
                    {viewing.accessCodePlain}
                  </p>
                  <button
                    type="button"
                    onClick={() => copyDetailCode(viewing.accessCodePlain!)}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-canvas px-3 py-1.5 text-sm text-fg"
                  >
                    {detailCopied ? <Check size={14} /> : <Copy size={14} />}
                    {detailCopied ? "Copiado" : "Copiar"}
                  </button>
                </div>
                <p className="mt-2 text-xs text-muted">
                  Visible mientras el usuario no complete su primer inicio de sesión y contraseña.
                </p>
              </div>
            ) : (
              <p className="mt-5 text-xs text-subtle">
                Sin código pendiente: el usuario ya completó su primer acceso o no tiene uno activo.
              </p>
            )}

            <div className="mt-6 flex flex-wrap gap-2">
              <Button type="button" size="sm" onClick={() => startEdit(viewing)}>
                Editar
              </Button>
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => toggleActive(viewing)}
              >
                {viewing.isActive ? "Desactivar" : "Activar"}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="danger"
                onClick={() => requestDelete(viewing)}
              >
                Eliminar
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleting && (
        <div className="fixed inset-0 z-[95] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-user-title"
            className="w-full max-w-md rounded-2xl border border-line bg-canvas p-6 shadow-soft"
          >
            <p className="section-label">Eliminar usuario</p>
            <h3 id="delete-user-title" className="mt-2 font-display text-xl font-semibold tracking-tight">
              ¿Eliminar a {deleting.firstName} {deleting.lastName}?
            </h3>
            <p className="mt-2 text-sm text-muted">
              Se borrará la cuenta{deleting.email ? ` (${deleting.email})` : ""}. Esta acción no se
              puede deshacer.
            </p>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                variant="danger"
                className="flex-1"
                isLoading={deleteBusy}
                onClick={confirmDelete}
              >
                Sí, eliminar
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                disabled={deleteBusy}
                onClick={() => setDeleting(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
