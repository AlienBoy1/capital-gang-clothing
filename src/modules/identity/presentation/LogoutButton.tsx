"use client";

import { LogOut } from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { BrandMark } from "@/components/BrandMark";
import { cn } from "@/shared/lib/cn";

interface LogoutButtonProps {
  className?: string;
  /** Optional label next to icon (drawer menus). Icon-only by default. */
  showLabel?: boolean;
}

export function LogoutButton({ className, showLabel = false }: LogoutButtonProps) {
  const [leaving, setLeaving] = useState(false);

  async function handleLogout() {
    if (leaving) return;
    setLeaving(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      await new Promise((resolve) => setTimeout(resolve, 900));
      window.location.href = "/";
    } catch {
      setLeaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleLogout}
        disabled={leaving}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg border border-line bg-elevated text-fg transition hover:border-line-strong hover:text-danger disabled:opacity-60",
          showLabel ? "px-3 py-2 text-sm" : "h-10 w-10",
          className
        )}
        aria-label="Cerrar sesión"
        title="Cerrar sesión"
      >
        <LogOut size={16} />
        {showLabel && <span>Cerrar sesión</span>}
      </button>

      {leaving &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-canvas animate-fade-in">
            <div className="relative mb-6">
              <span className="absolute -inset-4 animate-ping rounded-full bg-brand/20" />
              <span className="absolute -inset-2 animate-pulse rounded-full bg-brand/10" />
              <BrandMark
                variant="seal"
                size="lg"
                className="relative drop-shadow-[0_0_24px_rgba(214,255,47,0.25)]"
              />
            </div>
            <p className="font-brand text-lg font-bold uppercase tracking-[0.04em]">
              Cerrando sesión
            </p>
            <p className="mt-2 text-sm text-muted">Hasta pronto…</p>
          </div>,
          document.body
        )}
    </>
  );
}
