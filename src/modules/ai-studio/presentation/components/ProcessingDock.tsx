"use client";

import { CheckCircle2, Loader2, X, XCircle } from "lucide-react";
import { cn } from "@/shared/lib/cn";

export type ProcessingDockState = {
  active: boolean;
  label: string;
  detail?: string;
  progress: number;
  assetIndex?: number;
  assetCount?: number;
  status: "running" | "success" | "error";
};

export function ProcessingDock({
  state,
  onDismiss,
}: {
  state: ProcessingDockState | null;
  onDismiss?: () => void;
}) {
  if (!state) return null;
  if (!state.active && state.status === "running") return null;

  const pct = Math.max(0, Math.min(100, Math.round(state.progress * 100)));

  return (
    <div className="pointer-events-none fixed inset-x-0 top-16 z-[90] flex justify-center px-3 sm:top-20 sm:justify-end sm:px-6">
      <div
        className={cn(
          "pointer-events-auto w-full max-w-md rounded-2xl border bg-surface/95 p-4 shadow-soft backdrop-blur-xl",
          state.status === "error"
            ? "border-danger/35"
            : state.status === "success"
              ? "border-brand/35"
              : "border-line"
        )}
        role="status"
        aria-live="polite"
      >
        <div className="flex items-start gap-3">
          <span className="mt-0.5 shrink-0">
            {state.status === "running" && (
              <Loader2 size={18} className="animate-spin text-brand" />
            )}
            {state.status === "success" && <CheckCircle2 size={18} className="text-brand" />}
            {state.status === "error" && <XCircle size={18} className="text-danger" />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold tracking-tight text-fg">{state.label}</p>
            {state.detail && <p className="mt-0.5 text-xs text-muted">{state.detail}</p>}
            {typeof state.assetCount === "number" && state.assetCount > 0 && (
              <p className="mt-1 text-[11px] uppercase tracking-wide text-subtle">
                Asset {(state.assetIndex ?? 0) + 1} de {state.assetCount}
              </p>
            )}
            <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-elevated">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-300",
                  state.status === "error" ? "bg-danger" : "bg-brand"
                )}
                style={{ width: `${state.status === "success" ? 100 : pct}%` }}
              />
            </div>
            <p className="mt-1.5 text-[11px] text-subtle">
              {state.status === "running"
                ? `${pct}% · puedes seguir navegando el proyecto`
                : state.status === "success"
                  ? "Listo"
                  : "Con error"}
            </p>
          </div>
          {(state.status === "success" || state.status === "error") && onDismiss && (
            <button
              type="button"
              onClick={onDismiss}
              className="rounded-lg p-1 text-muted transition hover:bg-elevated hover:text-fg"
              aria-label="Cerrar"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
