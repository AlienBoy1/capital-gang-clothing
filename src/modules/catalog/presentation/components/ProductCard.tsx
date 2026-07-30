"use client";

import Image from "next/image";
import { Check, ShoppingBag } from "lucide-react";
import { useState } from "react";
import { useCartStore } from "@/modules/cart/presentation/cart.store";
import { cn } from "@/shared/lib/cn";
import { ImageLightbox, useLightbox } from "@/shared/ui/components/ImageLightbox";
import {
  DEFAULT_STOCK_THRESHOLDS,
  resolveStockLevel,
  stockLevelLabel,
  stockLevelTone,
  type StockThresholds,
} from "@/shared/lib/stock";

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  discountPrice?: number | null;
  storeType: "CLOTHING" | "TATTOO_SHOP";
  isFeatured: boolean;
  stock: number;
  images: Array<{
    id: string;
    url: string;
    alt?: string | null;
    isCover: boolean;
  }>;
}

interface ProductCardProps {
  product: CatalogProduct;
  hrefBase?: "/tienda" | "/tattoo-shop";
  className?: string;
  thresholds?: StockThresholds;
  onView?: () => void;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProductCard({
  product,
  className,
  thresholds = DEFAULT_STOCK_THRESHOLDS,
  onView,
}: ProductCardProps) {
  const cover =
    product.images.find((image) => image.isCover)?.url ?? product.images[0]?.url ?? null;
  const price = product.discountPrice ?? product.basePrice;
  const hasDiscount = product.discountPrice != null;
  const lightboxImages = product.images.map((image) => ({
    src: image.url,
    alt: image.alt || product.name,
  }));
  const lightbox = useLightbox(lightboxImages);
  const addItem = useCartStore((state) => state.addItem);
  const [added, setAdded] = useState(false);
  const level = resolveStockLevel(product.stock ?? 0, thresholds);

  function handleAdd(event: React.MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    if (level === "out") return;
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      price: Number(price),
      image: cover,
      storeType: product.storeType,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return (
    <article className={cn("group flex flex-col", className)}>
      <div className="overflow-hidden rounded-xl border border-line bg-elevated sm:rounded-2xl">
        <div className="relative aspect-[4/5] overflow-hidden bg-surface">
          {cover ? (
            <button
              type="button"
              onClick={() => lightbox.show(0)}
              className="absolute inset-0"
              aria-label={`Ver imágenes de ${product.name}`}
            >
              <Image
                src={cover}
                alt={product.images[0]?.alt || product.name}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
              />
              {product.images.length > 1 && (
                <span className="absolute bottom-2 right-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.6rem] font-medium text-white backdrop-blur sm:bottom-3 sm:right-3 sm:px-2.5 sm:py-1 sm:text-[0.65rem]">
                  {product.images.length}
                </span>
              )}
            </button>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--glow),transparent_55%),linear-gradient(160deg,var(--elevated),var(--surface))]" />
          )}
          {product.isFeatured && (
            <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.14em] text-brand-fg sm:left-3 sm:top-3 sm:px-3 sm:py-1 sm:text-[0.65rem] sm:tracking-[0.18em]">
              Destacado
            </span>
          )}
          <span
            className={cn(
              "pointer-events-none absolute bottom-2 left-2 rounded-full border px-2 py-0.5 text-[0.55rem] font-semibold uppercase tracking-[0.1em] backdrop-blur sm:bottom-3 sm:left-3 sm:px-2.5 sm:text-[0.65rem]",
              stockLevelTone(level)
            )}
          >
            {stockLevelLabel(level)}
          </span>
        </div>
      </div>

      <div className="mt-3 flex flex-1 flex-col sm:mt-4">
        <h2 className="font-display text-sm font-semibold leading-snug tracking-tight text-fg sm:text-lg">
          {product.name}
        </h2>
        <p className="mt-1 line-clamp-2 text-xs text-muted sm:text-sm">{product.description}</p>
        <div className="mt-3 flex flex-col gap-2 sm:mt-4">
          <div className="flex items-baseline gap-2">
            <span className="text-sm font-semibold text-fg sm:text-base">{formatPrice(Number(price))}</span>
            {hasDiscount && (
              <span className="text-xs text-subtle line-through sm:text-sm">
                {formatPrice(product.basePrice)}
              </span>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleAdd}
              disabled={level === "out"}
              className={cn(
                "inline-flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold transition sm:text-sm",
                level === "out"
                  ? "cursor-not-allowed bg-elevated text-subtle"
                  : added
                    ? "bg-brand text-brand-fg"
                    : "bg-brand text-brand-fg hover:opacity-90"
              )}
            >
              {added ? <Check size={14} /> : <ShoppingBag size={14} />}
              {level === "out" ? "Agotado" : added ? "Listo" : "Agregar"}
            </button>
            <button
              type="button"
              onClick={onView}
              className="inline-flex items-center justify-center rounded-full border border-line px-3 py-2 text-xs font-medium text-muted transition hover:text-fg sm:text-sm"
            >
              Ver
            </button>
          </div>
        </div>
      </div>

      <ImageLightbox {...lightbox.props} images={lightboxImages} />
    </article>
  );
}
