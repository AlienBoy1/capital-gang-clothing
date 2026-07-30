"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  GitCompare,
  History,
  Layers,
  Megaphone,
  Trash2,
  Wand2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/shared/ui/components/Button";
import { ConfirmDialog } from "@/shared/ui/components/ConfirmDialog";
import { AssetActionBar } from "./components/AssetActionBar";
import { AssetCompare } from "./components/AssetCompare";
import { AssetGallery } from "./components/AssetGallery";
import { AssetPreview } from "./components/AssetPreview";
import { AssetSelector } from "./components/AssetSelector";
import { AssetTimeline } from "./components/AssetTimeline";
import { AIUploader } from "./components/AIUploader";
import { PublicationHistory } from "./components/PublicationHistory";
import { VersionHistory } from "./components/VersionHistory";
import { ProcessingStatus } from "./components/ProcessingStatus";
import {
  ProcessingDock,
  type ProcessingDockState,
} from "./components/ProcessingDock";
import type { TimelineLiveStep } from "./components/AssetTimeline";
import type { AIProjectDetail, AIVersionDTO } from "./types";
import type { AIAssetType } from "../domain/entities";
import { AI_ASSET_TYPE_LABELS } from "../domain/entities";
import { cn } from "@/shared/lib/cn";
import { notify } from "@/shared/ui/toast/toast.store";

type Panel = "gallery" | "timeline" | "compare" | "history" | "publications";

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => void | Promise<void>;
} | null;

export function ProjectWorkspace({ projectId }: { projectId: string }) {
  const router = useRouter();
  const [project, setProject] = useState<AIProjectDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [activeAssetId, setActiveAssetId] = useState<string | null>(null);
  const [panel, setPanel] = useState<Panel>("gallery");
  const [compareVersionIds, setCompareVersionIds] = useState<string[]>([]);
  const [previewVersion, setPreviewVersion] = useState<AIVersionDTO | null>(null);
  const [processing, setProcessing] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [timelineVersionId, setTimelineVersionId] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const [dock, setDock] = useState<ProcessingDockState | null>(null);
  const [liveStepsByAsset, setLiveStepsByAsset] = useState<Record<string, TimelineLiveStep[]>>(
    {}
  );

  const load = useCallback(async () => {
    const res = await fetch(`/api/ai-studio/projects/${projectId}`);
    if (!res.ok) {
      setError("Proyecto no encontrado");
      setLoading(false);
      return;
    }
    const data = (await res.json()) as AIProjectDetail;
    setProject(data);
    setLoading(false);
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  const activeAsset = useMemo(
    () => project?.assets.find((a) => a.id === activeAssetId) ?? null,
    [project, activeAssetId]
  );

  function toggleSelect(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function handleUploaded(urls: string[]) {
    setError(null);
    const res = await fetch(`/api/ai-studio/projects/${projectId}/assets`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ urls }),
    });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.message ?? "No se pudieron registrar las fotos";
      setError(message);
      notify.error("Error al subir", message);
      return;
    }
    await load();
    notify.success(
      "Fotografías listas",
      `${urls.length} original${urls.length === 1 ? "" : "es"} agregada${urls.length === 1 ? "" : "s"} al proyecto`
    );
  }

  async function handleProcess(assetIds?: string[]) {
    const ids = assetIds ?? [...selectedIds];
    if (!ids.length) {
      notify.info("Selecciona assets", "Elige uno o más assets para procesar");
      return;
    }
    if (processing) {
      notify.info("Ya hay un proceso", "Espera a que termine la edición en curso");
      return;
    }

    setProcessing(true);
    setError(null);
    setPanel("timeline");
    if (ids[0]) setActiveAssetId(ids[0]);
    setDock({
      active: true,
      status: "running",
      label: "Editando productos…",
      detail: "Reiniciando historial y recorte ONNX",
      progress: 0.02,
      assetIndex: 0,
      assetCount: ids.length,
    });

    try {
      const res = await fetch(`/api/ai-studio/projects/${projectId}/process`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({ assetIds: ids, stream: true }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        const message = data.message ?? "Error al procesar";
        setError(message);
        setDock({
          active: true,
          status: "error",
          label: "Procesamiento fallido",
          detail: message,
          progress: 1,
          assetCount: ids.length,
        });
        notify.error("Procesamiento fallido", message);
        return;
      }

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("text/event-stream") || !res.body) {
        const data = await res.json();
        if (data.project) setProject(data.project);
        else await load();
        setLiveStepsByAsset({});
        if (data.ok === false) {
          const detail = data.message ?? "Error al procesar";
          setError(detail);
          setDock({
            active: true,
            status: "error",
            label: "No se pudo modelar",
            detail,
            progress: 1,
          });
          notify.error("No se pudo modelar el producto", detail);
        } else {
          setDock({
            active: true,
            status: "success",
            label: "Producto modelado",
            detail: "Variantes y sello listos",
            progress: 1,
          });
          notify.success("Producto modelado", "Edición completada.");
        }
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalOk = true;
      let finalMessage: string | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const chunks = buffer.split("\n\n");
        buffer = chunks.pop() ?? "";

        for (const chunk of chunks) {
          const line = chunk
            .split("\n")
            .map((l) => l.trim())
            .find((l) => l.startsWith("data:"));
          if (!line) continue;
          const raw = line.replace(/^data:\s*/, "");
          let event: Record<string, unknown>;
          try {
            event = JSON.parse(raw) as Record<string, unknown>;
          } catch {
            continue;
          }

          const assetId = typeof event.assetId === "string" ? event.assetId : null;
          if (assetId) setActiveAssetId(assetId);

          if (event.type === "history_reset" && assetId) {
            setProject((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                assets: prev.assets.map((asset) => {
                  if (asset.id !== assetId) return asset;
                  const original =
                    asset.versions.find((v) => v.isOriginal) ??
                    asset.versions.find((v) => v.id === event.originalVersionId) ??
                    null;
                  const onlyOriginal = original
                    ? [{ ...original, isCurrent: true }]
                    : asset.versions.filter((v) => v.isOriginal);
                  return {
                    ...asset,
                    status: "PROCESSING",
                    assetType: "ORIGINAL",
                    currentVersionId: onlyOriginal[0]?.id ?? null,
                    currentVersion: onlyOriginal[0] ?? null,
                    versions: onlyOriginal,
                  };
                }),
              };
            });
            setLiveStepsByAsset((prev) => ({ ...prev, [assetId]: [] }));
          } else if (event.type === "job_start" && assetId) {
            const pipeline = Array.isArray(event.pipeline)
              ? (event.pipeline as AIAssetType[])
              : [];
            const steps: TimelineLiveStep[] = [
              {
                key: `${assetId}-PREPARE`,
                processingType: "PREPARE",
                label: "Preparando original",
                status: "pending",
              },
              {
                key: `${assetId}-CUTOUT`,
                processingType: "CUTOUT",
                label: "Recorte ONNX",
                status: "pending",
              },
              ...pipeline.map((type) => ({
                key: `${assetId}-${type}`,
                processingType: type as AIAssetType | "CUTOUT" | "PREPARE",
                label: `Generando ${AI_ASSET_TYPE_LABELS[type]}`,
                status: "pending" as const,
              })),
            ];
            setLiveStepsByAsset((prev) => ({ ...prev, [assetId]: steps }));
            setDock({
              active: true,
              status: "running",
              label: "Editando en segundo plano…",
              detail: "Historial reiniciado · generando variantes",
              progress: 0.05,
              assetIndex: typeof event.assetIndex === "number" ? event.assetIndex : 0,
              assetCount: typeof event.assetCount === "number" ? event.assetCount : ids.length,
            });
          } else if (event.type === "step" && assetId) {
            const processingType = event.processingType as
              | AIAssetType
              | "CUTOUT"
              | "PREPARE"
              | undefined;
            const stepStatus = (event.stepStatus as TimelineLiveStep["status"]) ?? "active";
            if (processingType) {
              setLiveStepsByAsset((prev) => {
                const current = prev[assetId] ?? [];
                return {
                  ...prev,
                  [assetId]: current.map((step) => {
                    if (step.processingType !== processingType) {
                      if (stepStatus === "active" && step.status === "active") {
                        return { ...step, status: "done" };
                      }
                      return step;
                    }
                    return {
                      ...step,
                      status: stepStatus,
                      label: String(event.label ?? step.label),
                    };
                  }),
                };
              });
            }
            setDock((prev) => ({
              active: true,
              status: "running",
              label: "Editando en segundo plano…",
              detail: String(event.label ?? "Procesando…"),
              progress: typeof event.progress === "number" ? event.progress : prev?.progress ?? 0.1,
              assetIndex: prev?.assetIndex ?? 0,
              assetCount: prev?.assetCount ?? ids.length,
            }));
          } else if (event.type === "version_ready" && assetId && event.version) {
            const version = event.version as AIVersionDTO;
            const processingType = event.processingType as AIAssetType;
            setProject((prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                assets: prev.assets.map((asset) => {
                  if (asset.id !== assetId) return asset;
                  const exists = asset.versions.some((v) => v.id === version.id);
                  const versions = exists
                    ? asset.versions.map((v) => (v.id === version.id ? version : v))
                    : [...asset.versions, version];
                  return { ...asset, versions, status: "PROCESSING" };
                }),
              };
            });
            setLiveStepsByAsset((prev) => {
              const current = prev[assetId] ?? [];
              return {
                ...prev,
                [assetId]: current.filter((step) => step.processingType !== processingType),
              };
            });
            setDock((prev) => ({
              active: true,
              status: "running",
              label: "Editando en segundo plano…",
              detail: `${AI_ASSET_TYPE_LABELS[processingType]} listo`,
              progress: typeof event.progress === "number" ? event.progress : prev?.progress ?? 0.5,
              assetIndex: prev?.assetIndex,
              assetCount: prev?.assetCount ?? ids.length,
            }));
          } else if (event.type === "job_done") {
            if (event.ok === false) {
              finalOk = false;
              finalMessage = String(event.errorMessage ?? finalMessage ?? "Error");
            }
            if (assetId) {
              setLiveStepsByAsset((prev) => {
                const next = { ...prev };
                delete next[assetId];
                return next;
              });
            }
            setDock((prev) => ({
              active: true,
              status: "running",
              label: "Editando en segundo plano…",
              detail:
                event.ok === false
                  ? String(event.errorMessage ?? "Error en asset")
                  : "Asset listo, continuando…",
              progress: typeof event.progress === "number" ? event.progress : prev?.progress ?? 0.5,
              assetIndex: prev?.assetIndex,
              assetCount: prev?.assetCount ?? ids.length,
            }));
          } else if (event.type === "complete" || event.type === "done") {
            if (event.project) setProject(event.project as AIProjectDetail);
            if (event.ok === false) {
              finalOk = false;
              finalMessage = String(event.message ?? finalMessage ?? "Error de procesamiento");
            }
          }
        }
      }

      await load();
      setLiveStepsByAsset({});

      if (!finalOk) {
        setError(finalMessage);
        setDock({
          active: true,
          status: "error",
          label: "Edición con errores",
          detail: finalMessage ?? "Revisa el asset marcado en error",
          progress: 1,
          assetCount: ids.length,
        });
        notify.error("No se pudo modelar el producto", finalMessage ?? undefined);
      } else {
        setDock({
          active: true,
          status: "success",
          label: "Edición completada",
          detail: "Historial nuevo · prendas oscuras con contraste · sello oficial",
          progress: 1,
          assetCount: ids.length,
        });
        notify.success("Producto modelado", "Revisa Flatlay / Fondo eliminado en la timeline.");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Error al procesar";
      setError(message);
      setLiveStepsByAsset({});
      setDock({
        active: true,
        status: "error",
        label: "Procesamiento fallido",
        detail: message,
        progress: 1,
      });
      notify.error("Procesamiento fallido", message);
    } finally {
      setProcessing(false);
    }
  }

  function askConfirm(next: ConfirmState) {
    setConfirm(next);
  }

  async function runConfirmed() {
    if (!confirm) return;
    setConfirmBusy(true);
    try {
      await confirm.onConfirm();
      setConfirm(null);
    } finally {
      setConfirmBusy(false);
    }
  }

  async function handlePublish() {
    if (!project) return;
    const versionIds = project.assets
      .filter((a) => selectedIds.has(a.id) && a.currentVersion)
      .map((a) => a.currentVersion!.id);

    if (!versionIds.length) {
      const message = "Selecciona assets listos con versión actual";
      setError(message);
      notify.error("No se puede publicar", message);
      return;
    }

    setPublishing(true);
    setError(null);
    const res = await fetch(`/api/ai-studio/projects/${projectId}/publish`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assetVersionIds: versionIds, storeType: "CLOTHING" }),
    });
    setPublishing(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      const message = data.message ?? "No se pudo publicar";
      setError(message);
      notify.error("Error al publicar", message);
      return;
    }
    const data = await res.json();
    notify.success("Sesión creada", "Abriendo formulario de producto…");
    router.push(data.redirectTo);
  }

  async function patchVersion(versionId: string, action: string) {
    const res = await fetch(`/api/ai-studio/versions/${versionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    if (res.ok) {
      await load();
      notify.success(
        action === "duplicate" ? "Versión duplicada" : "Versión restaurada",
        action === "duplicate"
          ? "Se creó una nueva versión a partir de la seleccionada"
          : "Esta versión es ahora la actual del asset"
      );
      return;
    }
    notify.error("No se pudo actualizar la versión");
  }

  async function deleteVersion(versionId: string) {
    askConfirm({
      title: "¿Eliminar esta versión?",
      description: "La versión original no se puede borrar. Esta acción no se puede deshacer.",
      confirmLabel: "Eliminar versión",
      onConfirm: async () => {
        const res = await fetch(`/api/ai-studio/versions/${versionId}`, { method: "DELETE" });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          const message = data.message ?? "No se pudo eliminar";
          setError(message);
          notify.error("Error al eliminar", message);
          return;
        }
        await load();
        notify.success("Versión eliminada");
      },
    });
  }

  async function deleteSelectedAssets() {
    const count = selectedIds.size;
    askConfirm({
      title: `¿Eliminar ${count} asset${count === 1 ? "" : "s"}?`,
      description: "Se eliminarán del proyecto junto con sus versiones derivadas.",
      confirmLabel: count === 1 ? "Eliminar asset" : "Eliminar assets",
      onConfirm: async () => {
        await Promise.all(
          [...selectedIds].map((id) => fetch(`/api/ai-studio/assets/${id}`, { method: "DELETE" }))
        );
        setSelectedIds(new Set());
        setActiveAssetId(null);
        await load();
        notify.success("Assets eliminados");
      },
    });
  }

  async function favoriteSelected() {
    await Promise.all(
      [...selectedIds].map((id) =>
        fetch(`/api/ai-studio/assets/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "favorite" }),
        })
      )
    );
    await load();
    notify.success("Favoritos actualizados");
  }

  function downloadSelected() {
    if (!project) return;
    project.assets
      .filter((a) => selectedIds.has(a.id) && a.currentVersion)
      .forEach((a) => {
        const link = document.createElement("a");
        link.href = a.currentVersion!.storagePath;
        link.download = "";
        link.target = "_blank";
        link.rel = "noreferrer";
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
  }

  function openCompareFromSelection() {
    if (!project) return;
    const versions = project.assets
      .filter((a) => selectedIds.has(a.id))
      .flatMap((a) => a.versions.filter((v) => v.isCurrent || v.isOriginal))
      .slice(0, 4);
    if (activeAsset) {
      setCompareVersionIds(activeAsset.versions.slice(-3).map((v) => v.id));
    } else {
      setCompareVersionIds(versions.map((v) => v.id));
    }
    setPanel("compare");
  }

  function openAsset(id: string) {
    setActiveAssetId(id);
    setPanel("timeline");
    const asset = project?.assets.find((a) => a.id === id);
    setTimelineVersionId(asset?.currentVersionId ?? null);
  }

  async function deleteProject() {
    askConfirm({
      title: "¿Eliminar este proyecto?",
      description: "Se borrarán todos los assets, versiones y el historial de publicación del estudio.",
      confirmLabel: "Eliminar proyecto",
      onConfirm: async () => {
        const res = await fetch(`/api/ai-studio/projects/${projectId}`, { method: "DELETE" });
        if (res.ok) router.push("/dashboard/ai-studio");
        else notify.error("No se pudo eliminar el proyecto");
      },
    });
  }

  const compareVersions = useMemo(() => {
    if (!project) return [];
    const all = project.assets.flatMap((a) => a.versions);
    return compareVersionIds
      .map((id) => all.find((v) => v.id === id))
      .filter(Boolean) as AIVersionDTO[];
  }, [project, compareVersionIds]);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="skeleton h-10 w-48" />
        <div className="skeleton h-40" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="skeleton aspect-square rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="panel p-8 text-center">
        <p className="text-sm text-muted">{error ?? "Proyecto no encontrado"}</p>
        <Link href="/dashboard/ai-studio" className="mt-4 inline-block text-sm text-brand">
          Volver al estudio
        </Link>
      </div>
    );
  }

  return (
    <div className={cn("space-y-6", selectedIds.size > 0 && "pb-28")}>
      <ProcessingDock state={dock} onDismiss={() => setDock(null)} />
      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title ?? ""}
        description={confirm?.description}
        confirmLabel={confirm?.confirmLabel}
        tone="danger"
        busy={confirmBusy}
        onCancel={() => {
          if (!confirmBusy) setConfirm(null);
        }}
        onConfirm={runConfirmed}
      />

      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/dashboard/ai-studio"
            className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted transition hover:text-fg"
          >
            <ArrowLeft size={14} />
            Estudio
          </Link>
          <ProcessingStatus
            status={
              project.status === "PROCESSING"
                ? "PROCESSING"
                : project.status === "PUBLISHED"
                  ? "PUBLISHED"
                  : project.status === "ARCHIVED"
                    ? "ARCHIVED"
                    : project.status === "READY"
                      ? "READY"
                      : "DRAFT"
            }
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h1 className="font-display text-2xl font-semibold tracking-tight sm:text-3xl">
              {project.name}
            </h1>
            {project.description && (
              <p className="mt-1 max-w-2xl text-sm text-muted">{project.description}</p>
            )}
            <p className="mt-2 text-xs text-subtle">
              {project.assets.length} assets · {project.publications.length} publicaciones
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => handleProcess(project.assets.map((a) => a.id))}
              isLoading={processing}
              disabled={!project.assets.length}
            >
              <Wand2 size={16} />
              Procesar todo
            </Button>
            <Button type="button" size="sm" variant="ghost" onClick={deleteProject}>
              <Trash2 size={16} />
              Eliminar
            </Button>
          </div>
        </div>
      </div>

      <AIUploader onUploaded={handleUploaded} />

      <p className="rounded-2xl border border-line bg-elevated/50 px-4 py-3 text-xs text-muted">
        Al regenerar se borra el historial previo del asset (queda solo el original) y se crea uno
        nuevo. Las prendas negras usan fondos claros / carbón con rim para no perder el silueta.
        El progreso aparece en la timeline en vivo.
      </p>

      {error && (
        <p className="rounded-xl border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {(
          [
            ["gallery", "Galería", Layers],
            ["timeline", "Timeline", History],
            ["compare", "Comparar", GitCompare],
            ["history", "Versiones", History],
            ["publications", "Publicaciones", Megaphone],
          ] as const
        ).map(([key, label, Icon]) => (
          <button
            key={key}
            type="button"
            onClick={() => setPanel(key)}
            className={cn(
              "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-2 text-xs transition",
              panel === key
                ? "border-brand bg-brand-soft text-brand"
                : "border-line text-muted hover:text-fg"
            )}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {panel === "gallery" && (
        <AssetGallery
          assets={project.assets}
          selectedIds={selectedIds}
          onSelect={toggleSelect}
          onOpen={openAsset}
        />
      )}

      {panel === "timeline" && (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <AssetSelector
            assets={project.assets}
            activeId={activeAssetId}
            onSelect={(id) => {
              setActiveAssetId(id);
              const asset = project.assets.find((a) => a.id === id);
              setTimelineVersionId(asset?.currentVersionId ?? null);
            }}
          />
          <div className="panel p-3 sm:p-4">
            {activeAsset ? (
              <AssetTimeline
                versions={activeAsset.versions}
                activeId={timelineVersionId}
                liveSteps={
                  activeAssetId ? liveStepsByAsset[activeAssetId] : undefined
                }
                onSelect={(version) => {
                  setTimelineVersionId(version.id);
                  setPreviewVersion(version);
                }}
              />
            ) : (
              <p className="py-10 text-center text-sm text-muted">
                Abre un asset desde la galería para ver su timeline.
              </p>
            )}
          </div>
        </div>
      )}

      {panel === "compare" && (
        <div className="space-y-4">
          {activeAsset && (
            <div className="flex flex-wrap gap-2">
              {activeAsset.versions.map((v) => {
                const checked = compareVersionIds.includes(v.id);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() =>
                      setCompareVersionIds((prev) =>
                        checked ? prev.filter((id) => id !== v.id) : [...prev, v.id].slice(-4)
                      )
                    }
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs",
                      checked
                        ? "border-brand bg-brand-soft text-brand"
                        : "border-line text-muted"
                    )}
                  >
                    v{v.versionNumber}
                  </button>
                );
              })}
            </div>
          )}
          <AssetCompare
            versions={compareVersions}
            onRestore={(id) => patchVersion(id, "restore")}
          />
        </div>
      )}

      {panel === "history" && (
        <div className="grid gap-4 lg:grid-cols-[240px_1fr]">
          <AssetSelector
            assets={project.assets}
            activeId={activeAssetId}
            onSelect={setActiveAssetId}
          />
          <div>
            {activeAsset ? (
              <VersionHistory
                versions={activeAsset.versions}
                onRestore={(id) => patchVersion(id, "restore")}
                onDuplicate={(id) => patchVersion(id, "duplicate")}
                onDelete={deleteVersion}
                onPreview={(id) => {
                  const v = activeAsset.versions.find((x) => x.id === id) ?? null;
                  setPreviewVersion(v);
                }}
              />
            ) : (
              <p className="panel py-10 text-center text-sm text-muted">
                Selecciona un asset para ver el historial de versiones.
              </p>
            )}
          </div>
        </div>
      )}

      {panel === "publications" && <PublicationHistory publications={project.publications} />}

      <AssetActionBar
        count={selectedIds.size}
        publishing={publishing}
        processing={processing}
        onFavorite={favoriteSelected}
        onDownload={downloadSelected}
        onProcess={() => handleProcess()}
        onDelete={deleteSelectedAssets}
        onCompare={openCompareFromSelection}
        onHistory={() => {
          const first = [...selectedIds][0];
          if (first) setActiveAssetId(first);
          setPanel("history");
        }}
        onPublish={handlePublish}
      />

      <AssetPreview version={previewVersion} onClose={() => setPreviewVersion(null)} />
    </div>
  );
}
