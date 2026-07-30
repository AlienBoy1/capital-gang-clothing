"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { DashboardNavLink } from "@/modules/identity/presentation/DashboardNavLink";
import { LogoutButton } from "@/modules/identity/presentation/LogoutButton";
import { cn } from "@/shared/lib/cn";
import { ToastHost } from "@/shared/ui/toast/ToastHost";

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

export function DashboardShell({
  navItems,
  children,
}: {
  navItems: NavItem[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const nav = (
    <nav className="grid gap-1">
      {navItems.map((item) => (
        <DashboardNavLink key={item.href} href={item.href} icon={item.icon} onNavigate={() => setOpen(false)}>
          {item.label}
        </DashboardNavLink>
      ))}
    </nav>
  );

  const drawer =
    mounted &&
    createPortal(
      <div className={cn("fixed inset-0 z-[80] lg:hidden", open ? "pointer-events-auto" : "pointer-events-none")}>
        <button
          type="button"
          className={cn("absolute inset-0 bg-black/70 transition-opacity", open ? "opacity-100" : "opacity-0")}
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-[min(100%,18rem)] flex-col border-r border-line bg-canvas p-5 shadow-soft transition-transform duration-300",
            open ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <div className="mb-6 flex items-center justify-between gap-3">
            <BrandMark variant="mark" size="lg" />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-elevated"
              onClick={() => setOpen(false)}
              aria-label="Cerrar"
            >
              <X size={18} />
            </button>
          </div>
          {nav}
          <div className="mt-auto space-y-2 border-t border-line pt-4">
            <Link
              href="/"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-full border border-line px-4 py-2.5 text-sm text-muted"
            >
              Ver sitio
            </Link>
            <LogoutButton showLabel className="w-full rounded-full" />
          </div>
        </aside>
      </div>,
      document.body
    );

  return (
    <div className="min-h-screen bg-canvas">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="hidden w-72 shrink-0 border-r border-line bg-surface/90 p-5 backdrop-blur-xl lg:flex lg:flex-col">
          <div className="mb-8">
            <BrandMark variant="horizontal" size="lg" />
          </div>
          {nav}
          <div className="mt-auto space-y-2 border-t border-line pt-4">
            <Link
              href="/"
              className="flex w-full items-center justify-center rounded-full border border-line px-4 py-2.5 text-sm text-muted transition hover:bg-elevated hover:text-fg"
            >
              Ver sitio
            </Link>
            <LogoutButton showLabel className="w-full rounded-full" />
          </div>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between lg:mb-8">
            <div className="flex items-center gap-3">
              <button
                type="button"
                className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-elevated lg:hidden"
                onClick={() => setOpen(true)}
                aria-label="Abrir menú"
              >
                <Menu size={18} />
              </button>
              <div>
                <p className="text-sm text-muted">Panel administrativo</p>
                <h1 className="font-display text-xl font-semibold tracking-tight">Capital Gang</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-line px-3 py-2 text-sm text-muted transition hover:bg-elevated hover:text-fg"
                title="Navegar el sitio como visitante"
              >
                Ver sitio
              </Link>
              <ThemeToggle />
              <LogoutButton />
            </div>
          </header>
          {children}
        </main>
      </div>
      {drawer}
      <ToastHost />
    </div>
  );
}
