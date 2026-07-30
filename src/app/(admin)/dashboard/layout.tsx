import { getCurrentSession } from "@/shared/lib/get-current-session";
import { can } from "@/modules/identity/domain/permissions";
import { DashboardShell } from "@/modules/identity/presentation/DashboardShell";
import { SetPasswordGate } from "@/modules/identity/presentation/SetPasswordGate";

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
  ]
    .filter((item) => !item.permission || can(role, item.permission))
    .map(({ href, label, icon }) => ({ href, label, icon }));

  return (
    <DashboardShell navItems={navItems}>
      <SetPasswordGate />
      {children}
    </DashboardShell>
  );
}
