import { ProductCard } from "@/modules/catalog/presentation/components/ProductCard";
import { prisma } from "@/shared/lib/prisma";
import { serializeProducts } from "@/shared/lib/serialize";
import { FadeInSection } from "@/shared/ui/animations/FadeInSection";

export const metadata = {
  title: "Tattoo Shop",
};

export default async function TattooShopPage() {
  const rows = await prisma.product
    .findMany({
      where: { storeType: "TATTOO_SHOP", isActive: true },
      include: { images: { orderBy: { order: "asc" } } },
      orderBy: [{ isFeatured: "desc" }, { createdAt: "desc" }],
    })
    .catch(() => []);

  const products = serializeProducts(rows);

  return (
    <main className="page-shell py-12 sm:py-16">
      <FadeInSection>
        <p className="section-label">Tattoo Shop</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Materiales con precisión
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          Tintas, agujas y accesorios de calidad para estudio profesional y artistas independientes.
        </p>
      </FadeInSection>

      {products.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold">Shop en construcción</p>
          <p className="mt-2 text-sm text-muted">Los productos del tattoo shop aparecerán aquí.</p>
        </div>
      ) : (
        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product, index) => (
            <FadeInSection key={product.id} delay={index * 50}>
              <ProductCard product={product} hrefBase="/tattoo-shop" />
            </FadeInSection>
          ))}
        </div>
      )}
    </main>
  );
}
