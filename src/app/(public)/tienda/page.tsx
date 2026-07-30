import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { prisma } from "@/shared/lib/prisma";
import { serializeProducts } from "@/shared/lib/serialize";
import { FadeInSection } from "@/shared/ui/animations/FadeInSection";

export const metadata = {
  title: "Tienda",
};

export const dynamic = "force-dynamic";

export default async function TiendaPage() {
  const rows = await prisma.product
    .findMany({
      where: { storeType: "CLOTHING", isActive: true },
      include: { images: { orderBy: { order: "asc" } } },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    })
    .catch(() => []);

  const products = serializeProducts(rows);

  return (
    <main className="page-shell py-10 sm:py-16">
      <FadeInSection>
        <p className="section-label">Tienda</p>
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Colección urbana
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted sm:mt-4 sm:text-base">
          Piezas con identidad, ediciones limitadas y accesorios para el día a día.
        </p>
      </FadeInSection>

      {products.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center sm:mt-12 sm:py-16">
          <p className="font-display text-xl font-semibold">Catálogo en preparación</p>
          <p className="mt-2 text-sm text-muted">Pronto verás las primeras piezas aquí.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {products.map((product, index) => (
            <FadeInSection key={product.id} delay={Math.min(index * 40, 200)}>
              <ProductCard product={product} hrefBase="/tienda" />
            </FadeInSection>
          ))}
        </div>
      )}
    </main>
  );
}
