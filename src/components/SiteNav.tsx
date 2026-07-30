"use client";

import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
import { CartButton } from "@/modules/cart/presentation/CartButton";
import { cn } from "@/shared/lib/cn";

const links = [
  { href: "/tienda", label: "Tienda" },
  { href: "/tattoo-shop", label: "Tattoo Shop" },
  { href: "/galeria", label: "Galería" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export function SiteNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const menu =
    mounted &&
    createPortal(
      <div
        className={cn(
          "fixed inset-0 z-[80] lg:hidden",
          open ? "pointer-events-auto" : "pointer-events-none"
        )}
        aria-hidden={!open}
      >
        <button
          type="button"
          className={cn(
            "absolute inset-0 bg-black/70 transition-opacity duration-300",
            open ? "opacity-100" : "opacity-0"
          )}
          aria-label="Cerrar menú"
          onClick={() => setOpen(false)}
        />

        <div
          className={cn(
            "absolute inset-y-0 right-0 flex w-[min(100%,22rem)] flex-col border-l border-line bg-canvas shadow-soft transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]",
            open ? "translate-x-0" : "translate-x-full"
          )}
        >
          <div className="flex h-16 items-center justify-between border-b border-line px-5">
            <BrandMark variant="mark" size="lg" />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-elevated text-fg"
              onClick={() => setOpen(false)}
              aria-label="Cerrar menú"
            >
              <X size={18} />
            </button>
          </div>

          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-4 py-6">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-xl px-4 py-3.5 font-display text-2xl font-semibold tracking-tight transition",
                    active ? "bg-brand-soft text-brand" : "text-fg hover:bg-elevated"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="border-t border-line p-4 space-y-3">
            <Link
              href="/carrito"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-full border border-line bg-elevated px-5 py-3 text-sm font-semibold text-fg"
            >
              Ver carrito
            </Link>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="flex w-full items-center justify-center rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-fg"
            >
              Iniciar sesión
            </Link>
          </div>
        </div>
      </div>,
      document.body
    );

  return (
    <>
      <header className="sticky top-0 z-[70] border-b border-line bg-canvas/95 backdrop-blur-xl">
        <div className="page-shell flex h-[4.5rem] items-center justify-between gap-3 sm:h-20">
          <Link href="/" className="relative shrink-0" aria-label="Capital Gang inicio">
            <span className="lg:hidden">
              <BrandMark variant="mark" size="lg" />
            </span>
            <span className="hidden lg:block">
              <BrandMark variant="horizontal" size="lg" />
            </span>
          </Link>

          <nav className="hidden items-center gap-1 lg:flex">
            {links.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm transition",
                    active ? "bg-brand-soft text-brand" : "text-muted hover:bg-elevated hover:text-fg"
                  )}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-2">
            <CartButton />
            <Link
              href="/login"
              className="hidden rounded-lg px-3 py-2 text-sm text-muted transition hover:text-fg sm:inline-flex"
            >
              Acceso
            </Link>
            <ThemeToggle />
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-elevated text-fg lg:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Cerrar menú" : "Abrir menú"}
              aria-expanded={open}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </header>
      {menu}
    </>
  );
}
