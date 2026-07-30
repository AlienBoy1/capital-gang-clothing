"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { ProductCard, type CatalogProduct } from "@/modules/catalog/presentation/components/ProductCard";
import { ProductDetailModal } from "@/modules/catalog/presentation/components/ProductDetailModal";
import type { StockThresholds } from "@/shared/lib/stock";
import { FadeInSection } from "@/shared/ui/animations/FadeInSection";

interface CatalogGridProps {
  products: CatalogProduct[];
  hrefBase: "/tienda" | "/tattoo-shop";
  thresholds: StockThresholds;
}

export function CatalogGrid({ products, hrefBase, thresholds }: CatalogGridProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedSlug = searchParams.get("p");

  const selected = useMemo(
    () => products.find((product) => product.slug === selectedSlug) ?? null,
    [products, selectedSlug]
  );

  const openProduct = useCallback(
    (slug: string) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("p", slug);
      router.push(`${pathname}?${params.toString()}`, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const closeProduct = useCallback(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("p");
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname, { scroll: false });
  }, [pathname, router, searchParams]);

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-4 lg:gap-6">
        {products.map((product, index) => (
          <FadeInSection key={product.id} delay={Math.min(index * 40, 200)}>
            <ProductCard
              product={product}
              hrefBase={hrefBase}
              thresholds={thresholds}
              onView={() => openProduct(product.slug)}
            />
          </FadeInSection>
        ))}
      </div>
      <ProductDetailModal product={selected} thresholds={thresholds} onClose={closeProduct} />
    </>
  );
}
