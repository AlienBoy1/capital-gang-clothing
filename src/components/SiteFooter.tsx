import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";

const links = [
  { href: "/tienda", label: "Tienda" },
  { href: "/tattoo-shop", label: "Tattoo Shop" },
  { href: "/galeria", label: "Galería" },
  { href: "/carrito", label: "Carrito" },
  { href: "/nosotros", label: "Nosotros" },
  { href: "/contacto", label: "Contacto" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-line bg-surface">
      <div className="page-shell grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-3">
        <div className="space-y-4">
          <BrandMark />
          <p className="max-w-xs text-sm leading-relaxed text-muted">
            Ropa urbana y cultura del tatuaje bajo una sola identidad. Hecho para la calle, pensado para quedarse.
          </p>
        </div>

        <div>
          <p className="section-label mb-4">Explorar</p>
          <ul className="space-y-2">
            {links.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="text-sm text-muted transition hover:text-fg">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="section-label mb-4">Contacto</p>
          <ul className="space-y-2 text-sm text-muted">
            <li>Ciudad de México</li>
            <li>
              <a href="mailto:contacto@capitalgang.com" className="transition hover:text-fg">
                contacto@capitalgang.com
              </a>
            </li>
            <li>
              <a href="/contacto" className="transition hover:text-fg">
                WhatsApp · Instagram
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-line">
        <div className="page-shell flex flex-col gap-2 py-5 text-xs text-subtle sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Capital Gang Clothing</p>
          <p>Una identidad. Dos mundos.</p>
        </div>
      </div>
    </footer>
  );
}
