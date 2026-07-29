import Link from "next/link";
import { getCurrentSession } from "@/shared/lib/get-current-session";
import { can } from "@/modules/identity/domain/permissions";
import { DashboardNavLink } from "@/modules/identity/presentation/DashboardNavLink";
import { BrandMark } from "@/components/BrandMark";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getCurrentSession();
  const role = session?.role ?? "USER";

  const navItems = [
    { href: "/dashboard", label: "Resumen", icon: "LayoutDashboard", permission: null },
    { href: "/dashboard/productos", label: "Ropa", icon: "Shirt", permission: "products.edit" as const },
    { href: "/dashboard/tattoo-shop", label: "Tattoo Shop", icon: "Syringe", permission: "tattooShop.manage" as const },
    { href: "/dashboard/galeria", label: "Galería", icon: "Images", permission: "gallery.manage" as const },
    { href: "/dashboard/ordenes", label: "Órdenes", icon: "ClipboardList", permission: "orders.view" as const },
    { href: "/dashboard/usuarios", label: "Usuarios", icon: "Users", permission: "users.editSelf" as const },
    { href: "/dashboard/configuracion", label: "Configuración", icon: "Settings", permission: "settings.critical.edit" as const },
  ];

  return (
    <div className="min-h-screen bg-canvas">
      <div className="flex min-h-screen flex-col lg:flex-row">
        <aside className="w-full border-b border-line bg-surface/90 p-4 backdrop-blur-xl lg:w-64 lg:shrink-0 lg:border-b-0 lg:border-r lg:p-5">
          <div className="mb-6">
            <BrandMark />
          </div>
          <nav className="grid gap-1 sm:grid-cols-2 lg:grid-cols-1">
            {navItems
              .filter((item) => !item.permission || can(role, item.permission))
              .map((item) => (
                <DashboardNavLink key={item.href} href={item.href} icon={item.icon}>
                  {item.label}
                </DashboardNavLink>
              ))}
          </nav>
        </aside>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          <header className="mb-6 flex flex-col gap-3 rounded-2xl border border-line bg-surface p-4 sm:flex-row sm:items-center sm:justify-between lg:mb-8">
            <div>
              <p className="text-sm text-muted">Panel administrativo</p>
              <h1 className="font-display text-xl font-semibold tracking-tight">Capital Gang</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/"
                className="rounded-full border border-line px-3 py-2 text-sm text-muted transition hover:bg-elevated hover:text-fg"
              >
                Ver sitio
              </Link>
              <ThemeToggle />
            </div>
          </header>
          {children}
        </main>
      </div>
    </div>
  );
}
