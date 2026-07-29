import { UsersManager } from "./UsersManager";

export default function UsuariosPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Usuarios</h1>
        <p className="mt-1 text-sm text-muted">Controla accesos, roles y permisos del equipo.</p>
      </div>
      <UsersManager />
    </div>
  );
}
