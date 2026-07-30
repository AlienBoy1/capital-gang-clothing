"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/components/Button";

interface SettingItem {
  key: string;
  value: string;
  label: string;
  hint?: string;
}

const DEFAULTS: SettingItem[] = [
  { key: "siteName", value: "Capital Gang Clothing", label: "Nombre del sitio" },
  { key: "siteDescription", value: "Ropa urbana y tattoo shop", label: "Descripción" },
  { key: "whatsapp", value: "3310899404", label: "WhatsApp de pedidos", hint: "Solo dígitos, con o sin 52" },
  {
    key: "stockThresholdHigh",
    value: "15",
    label: "Umbral stock alto (mucho)",
    hint: "Si el stock es ≥ este valor se muestra «Mucho stock»",
  },
  {
    key: "stockThresholdMedium",
    value: "5",
    label: "Umbral stock medio",
    hint: "Si el stock es ≥ este valor (y menor al alto) se muestra «Stock medio»; debajo = «Poco stock»",
  },
];

export function SettingsManager() {
  const [settings, setSettings] = useState<SettingItem[]>(DEFAULTS);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (!Array.isArray(data) || !data.length) return;
        const map = Object.fromEntries(data.map((item: { key: string; value: string }) => [item.key, item.value]));
        setSettings((prev) =>
          prev.map((item) => ({
            ...item,
            value: map[item.key] ?? item.value,
          }))
        );
      })
      .catch(() => undefined);
  }, []);

  async function saveSettings() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings.map(({ key, value }) => ({ key, value }))),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="panel space-y-5">
      <div>
        <h2 className="font-display text-xl font-semibold">Configuración</h2>
        <p className="mt-1 text-sm text-muted">
          WhatsApp de checkout y umbrales de etiquetas de stock en tienda.
        </p>
      </div>
      {settings.map((setting) => (
        <div key={setting.key} className="space-y-2">
          <label className="text-sm font-medium text-fg">{setting.label}</label>
          {setting.hint && <p className="text-xs text-subtle">{setting.hint}</p>}
          <input
            value={setting.value}
            onChange={(e) =>
              setSettings((prev) =>
                prev.map((item) => (item.key === setting.key ? { ...item, value: e.target.value } : item))
              )
            }
            className="input-field"
          />
        </div>
      ))}
      <div className="flex items-center gap-3">
        <Button onClick={saveSettings} isLoading={saving}>
          Guardar configuración
        </Button>
        {saved && <span className="text-sm text-brand">Guardado</span>}
      </div>
    </div>
  );
}
