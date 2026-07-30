"use client";

import Image from "next/image";
import { Loader2 } from "lucide-react";
import { AI_ASSET_TYPE_LABELS, formatBytes } from "../../domain/entities";
import type { AIAssetType } from "../../domain/entities";
import type { AIVersionDTO } from "../types";
import { cn } from "@/shared/lib/cn";

export type TimelineLiveStep = {
  key: string;
  processingType: AIAssetType | "CUTOUT" | "PREPARE";
  label: string;
  status: "pending" | "active" | "done" | "error";
};

export function AssetTimeline({
  versions,
  activeId,
  onSelect,
  liveSteps,
}: {
  versions: AIVersionDTO[];
  activeId?: string | null;
  onSelect: (version: AIVersionDTO) => void;
  liveSteps?: TimelineLiveStep[];
}) {
  const ordered = [...versions].sort((a, b) => a.versionNumber - b.versionNumber);
  const showLive = (liveSteps?.length ?? 0) > 0;

  return (
    <div className="relative space-y-0 pl-2">
      <div className="absolute bottom-3 left-[19px] top-3 w-px bg-line" />
      {ordered.map((version) => {
        const active = version.id === activeId || (!activeId && version.isCurrent);
        return (
          <button
            key={version.id}
            type="button"
            onClick={() => onSelect(version)}
            className={cn(
              "relative flex w-full gap-3 rounded-xl p-2 text-left transition hover:bg-elevated",
              active && "bg-brand-soft/50"
            )}
          >
            <span
              className={cn(
                "relative z-10 mt-3 h-3 w-3 shrink-0 rounded-full border-2",
                active ? "border-brand bg-brand" : "border-line-strong bg-canvas"
              )}
            />
            <div
              className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-elevated"
              style={{
                backgroundImage:
                  "linear-gradient(45deg,#ccc 25%,transparent 25%),linear-gradient(-45deg,#ccc 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#ccc 75%),linear-gradient(-45deg,transparent 75%,#ccc 75%)",
                backgroundSize: "10px 10px",
                backgroundPosition: "0 0,0 5px,5px -5px,-5px 0",
              }}
            >
              <Image src={version.storagePath} alt="" fill sizes="56px" className="object-contain" />
            </div>
            <div className="min-w-0 flex-1 py-0.5">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-fg">
                  v{version.versionNumber} · {AI_ASSET_TYPE_LABELS[version.processingType]}
                </p>
                {version.isCurrent && (
                  <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-semibold text-brand-fg">
                    Actual
                  </span>
                )}
                {version.isOriginal && (
                  <span className="rounded-full bg-elevated px-2 py-0.5 text-[10px] text-muted">
                    Original
                  </span>
                )}
              </div>
              <p className="mt-0.5 text-[11px] text-muted">
                {new Date(version.createdAt).toLocaleString("es-MX", {
                  day: "2-digit",
                  month: "short",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
                {" · "}
                {version.width && version.height ? `${version.width}×${version.height}` : "—"}
                {" · "}
                {formatBytes(version.size)}
              </p>
              {version.notes && <p className="mt-1 line-clamp-1 text-[11px] text-subtle">{version.notes}</p>}
            </div>
          </button>
        );
      })}

      {showLive &&
        liveSteps!.map((step) => {
          const label =
            step.processingType === "CUTOUT"
              ? "Recorte ONNX"
              : step.processingType === "PREPARE"
                ? "Preparación"
                : AI_ASSET_TYPE_LABELS[step.processingType];
          return (
            <div
              key={step.key}
              className={cn(
                "relative flex w-full gap-3 rounded-xl p-2 text-left",
                step.status === "active" && "bg-brand-soft/40"
              )}
            >
              <span
                className={cn(
                  "relative z-10 mt-3 flex h-3 w-3 shrink-0 items-center justify-center rounded-full border-2",
                  step.status === "active" && "border-brand bg-brand",
                  step.status === "done" && "border-brand bg-brand/40",
                  step.status === "pending" && "border-line-strong bg-canvas",
                  step.status === "error" && "border-danger bg-danger"
                )}
              />
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-dashed border-line bg-elevated/60">
                {step.status === "active" ? (
                  <Loader2 size={18} className="animate-spin text-brand" />
                ) : (
                  <span className="text-[10px] uppercase tracking-wide text-subtle">
                    {step.status === "done" ? "OK" : step.status === "error" ? "ERR" : "…"}
                  </span>
                )}
              </div>
              <div className="min-w-0 flex-1 py-0.5">
                <p className="text-sm font-medium text-fg">{label}</p>
                <p className="mt-0.5 text-[11px] text-muted">{step.label}</p>
                <p className="mt-1 text-[10px] uppercase tracking-wide text-subtle">
                  {step.status === "active"
                    ? "En proceso"
                    : step.status === "done"
                      ? "Completado"
                      : step.status === "error"
                        ? "Error"
                        : "En cola"}
                </p>
              </div>
            </div>
          );
        })}
    </div>
  );
}
