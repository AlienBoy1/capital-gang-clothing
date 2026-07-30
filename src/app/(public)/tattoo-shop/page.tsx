import { Suspense } from "react";
import { CatalogGrid } from "@/modules/catalog/presentation/components/CatalogGrid";
import { prisma } from "@/shared/lib/prisma";
import { serializeProducts } from "@/shared/lib/serialize";
import { DEFAULT_STOCK_THRESHOLDS } from "@/shared/lib/stock";
import { FadeInSection } from "@/shared/ui/animations/FadeInSection";

export const metadata = {
  title: "Tattoo Shop",
};

export const dynamic = "force-dynamic";

async function getStockThresholds() {
  const settings = await prisma.appSetting
    .findMany({ where: { key: { in: ["stockThresholdHigh", "stockThresholdMedium"] } } })
    .catch(() => []);
  const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
  return {
    high: Number(map.stockThresholdHigh) || DEFAULT_STOCK_THRESHOLDS.high,
    medium: Number(map.stockThresholdMedium) || DEFAULT_STOCK_THRESHOLDS.medium,
  };
}

export default async function TattooShopPage() {
  const [rows, thresholds] = await Promise.all([
    prisma.product
      .findMany({
        where: { storeType: "TATTOO_SHOP", isActive: true },
        include: { images: { orderBy: { order: "asc" } } },
        orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
      })
      .catch(() => []),
    getStockThresholds(),
  ]);

  const products = serializeProducts(rows);

  return (
    <main className="page-shell py-10 sm:py-16">
      <FadeInSection>
        <p className="section-label">Tattoo Shop</p>
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Materiales con precisión
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted sm:mt-4 sm:text-base">
          Tintas, agujas y accesorios de calidad para estudio profesional y artistas independientes.
        </p>
      </FadeInSection>

      {products.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center sm:mt-12 sm:py-16">
          <p className="font-display text-xl font-semibold">Shop en construcción</p>
          <p className="mt-2 text-sm text-muted">Los productos del tattoo shop aparecerán aquí.</p>
        </div>
      ) : (
        <Suspense fallback={<div className="mt-10 skeleton h-64" />}>
          <CatalogGrid products={products} hrefBase="/tattoo-shop" thresholds={thresholds} />
        </Suspense>
      )}
    </main>
  );
}
