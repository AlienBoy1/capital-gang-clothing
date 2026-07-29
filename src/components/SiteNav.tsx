"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { useEffect, useState } from "react";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";
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

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-overlay backdrop-blur-xl">
      <div className="page-shell flex h-16 items-center justify-between sm:h-[4.25rem]">
        <Link href="/" className="relative z-50" aria-label="Capital Gang inicio">
          <BrandMark compact />
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
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
          <Link
            href="/login"
            className="hidden rounded-lg px-3 py-2 text-sm text-muted transition hover:text-fg sm:inline-flex"
          >
            Acceso
          </Link>
          <ThemeToggle />
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line text-fg md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label={open ? "Cerrar menú" : "Abrir menú"}
            aria-expanded={open}
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-canvas/95 backdrop-blur-md transition-all duration-300 md:hidden",
          open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
      >
        <nav className="page-shell flex h-full flex-col justify-center gap-2 pb-24 pt-20">
          {links.map((link, i) => (
            <Link
              key={link.href}
              href={link.href}
              style={{ animationDelay: `${i * 40}ms` }}
              className={cn(
                "rounded-xl px-4 py-4 font-display text-3xl font-semibold tracking-tight transition",
                pathname === link.href ? "text-brand" : "text-fg hover:text-brand",
                open && "animate-fade-up"
              )}
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="mt-6 inline-flex w-fit rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-fg"
          >
            Iniciar sesión
          </Link>
        </nav>
      </div>
    </header>
  );
}
