"use client";

import { useEffect, useState } from "react";
import { Button } from "@/shared/ui/components/Button";

interface SettingItem {
  id?: string;
  key: string;
  value: string;
}

export function SettingsManager() {
  const [settings, setSettings] = useState<SettingItem[]>([
    { key: "siteName", value: "Capital Gang Clothing" },
    { key: "siteDescription", value: "Ropa urbana y tattoo shop" },
    { key: "whatsapp", value: "+52 55 0000 0000" },
  ]);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data) && data.length) {
          setSettings(data.map((item: { key: string; value: string }) => ({ key: item.key, value: item.value })));
        }
      })
      .catch(() => undefined);
  }, []);

  async function saveSettings() {
    setSaving(true);
    setSaved(false);
    await fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    setSaved(true);
  }

  return (
    <div className="panel space-y-5">
      {settings.map((setting) => (
        <div key={setting.key} className="space-y-2">
          <label className="text-sm font-medium text-fg">{setting.key}</label>
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
