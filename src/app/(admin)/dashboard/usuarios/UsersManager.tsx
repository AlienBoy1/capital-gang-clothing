"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/components/Button";

interface UserItem {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  role: string;
  isActive: boolean;
}

export function UsersManager() {
  const [users, setUsers] = useState<UserItem[]>([]);
  const [saving, setSaving] = useState(false);
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
    const res = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setForm({ firstName: "", lastName: "", phone: "", email: "", role: "USER" });
      await loadUsers();
    }
    setSaving(false);
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="panel space-y-4">
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
        <Button type="submit" isLoading={saving}>
          Crear usuario
        </Button>
      </form>

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
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
