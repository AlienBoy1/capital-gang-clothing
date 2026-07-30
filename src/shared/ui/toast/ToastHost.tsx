"use client";

import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/cn";
import { useToastStore, type ToastTone } from "./toast.store";

const TONE_STYLES: Record<ToastTone, string> = {
  success: "border-brand/40 bg-surface text-fg",
  error: "border-danger/40 bg-surface text-fg",
  info: "border-line bg-surface text-fg",
};

const TONE_ICON: Record<ToastTone, typeof CheckCircle2> = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

const TONE_ICON_COLOR: Record<ToastTone, string> = {
  success: "text-brand",
  error: "text-danger",
  info: "text-muted",
};

export function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 bottom-24 z-[100] flex flex-col items-center gap-2 p-3 sm:inset-x-auto sm:bottom-6 sm:right-6 sm:items-end sm:p-0"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((item) => {
        const Icon = TONE_ICON[item.tone];
        return (
          <div
            key={item.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-soft backdrop-blur-xl transition duration-200 sm:w-96",
              TONE_STYLES[item.tone]
            )}
          >
            <Icon size={18} className={cn("mt-0.5 shrink-0", TONE_ICON_COLOR[item.tone])} />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold tracking-tight">{item.title}</p>
              {item.description && (
                <p className="mt-0.5 text-xs text-muted">{item.description}</p>
              )}
            </div>
            <button
              type="button"
              onClick={() => dismiss(item.id)}
              className="rounded-lg p-1 text-muted transition hover:bg-elevated hover:text-fg"
              aria-label="Cerrar notificación"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>,
    document.body
  );
}
