"use client";

import { Plus, Sparkles, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/shared/ui/components/Button";
import { notify } from "@/shared/ui/toast/toast.store";
import { AIProjectCard } from "./components/AIProjectCard";
import type { AIProjectListItem } from "./types";

export function AIProjectList() {
  const [projects, setProjects] = useState<AIProjectListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/ai-studio/projects");
    if (res.ok) setProjects(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch("/api/ai-studio/projects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.message ?? "No se pudo crear el proyecto";
      setError(message);
      notify.error("Error al crear proyecto", message);
      setSaving(false);
      return;
    }
    const project = await res.json();
    setForm({ name: "", description: "" });
    setShowForm(false);
    setSaving(false);
    notify.success("Proyecto creado", "Abriendo el estudio…");
    window.location.href = `/dashboard/ai-studio/${project.id}`;
  }

  return (
    <div className="space-y-6 pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 text-brand">
            <Sparkles size={18} />
            <span className="text-xs font-semibold uppercase tracking-[0.18em]">AI Product Studio</span>
          </div>
          <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Estudio creativo
          </h1>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Crea proyectos, procesa fotografías con IA y publica assets versionados al catálogo sin
            duplicar archivos.
          </p>
        </div>
        <Button type="button" onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus size={18} />
          Nuevo proyecto
        </Button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="panel space-y-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-fg">Nuevo proyecto creativo</p>
            <button
              type="button"
              onClick={() => {
                setShowForm(false);
                setError(null);
              }}
              className="rounded-lg p-2 text-muted hover:bg-elevated hover:text-fg"
              aria-label="Cerrar"
            >
              <X size={16} />
            </button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Nombre del proyecto"
              required
              className="input-field md:col-span-2"
            />
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Descripción (opcional)"
              className="input-field min-h-24 md:col-span-2"
            />
          </div>
          {error && <p className="text-sm text-danger">{error}</p>}
          <Button type="submit" isLoading={saving}>
            Crear y abrir
          </Button>
        </form>
      )}

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="skeleton h-64 rounded-2xl" />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-16 text-center">
          <Sparkles className="mx-auto text-brand" size={32} />
          <p className="mt-4 font-display text-lg font-semibold text-fg">Tu estudio está vacío</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted">
            Crea el primer proyecto, sube fotografías y genera assets listos para el catálogo.
          </p>
          <Button type="button" className="mt-6" onClick={() => setShowForm(true)}>
            <Plus size={18} />
            Crear proyecto
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {projects.map((project) => (
            <AIProjectCard key={project.id} project={project} />
          ))}
        </div>
      )}
    </div>
  );
}
