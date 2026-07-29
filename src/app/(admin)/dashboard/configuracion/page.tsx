import { SettingsManager } from "./SettingsManager";

export default function ConfiguracionPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Configuración</h1>
        <p className="mt-1 text-sm text-muted">Ajusta las preferencias y datos base del negocio.</p>
      </div>
      <SettingsManager />
    </div>
  );
}
