import { getCurrentSession } from "@/shared/lib/get-current-session";
import { prisma } from "@/shared/lib/prisma";
import { StatCard } from "@/modules/identity/presentation/StatCard";

export default async function DashboardHomePage() {
  const session = await getCurrentSession();

  const [productCount, orderCount, pendingOrders, albumCount] = await Promise.all([
    prisma.product.count({ where: { isActive: true } }).catch(() => 0),
    prisma.order.count().catch(() => 0),
    prisma.order.count({ where: { status: { in: ["NEW", "PENDING"] } } }).catch(() => 0),
    prisma.galleryAlbum.count().catch(() => 0),
  ]);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold tracking-tight">Resumen</h1>
      <p className="mt-1 text-sm text-muted">
        Bienvenido{session ? "" : ""}. Estado actual del negocio.
      </p>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard label="Productos activos" value={productCount} />
        <StatCard label="Órdenes totales" value={orderCount} />
        <StatCard label="Órdenes pendientes" value={pendingOrders} accent />
        <StatCard label="Álbumes de galería" value={albumCount} />
      </div>
    </div>
  );
}
