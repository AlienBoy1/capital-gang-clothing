"use client";

import Image from "next/image";
import Link from "next/link";
import { cn } from "@/shared/lib/cn";
import { ImageLightbox, useLightbox } from "@/shared/ui/components/ImageLightbox";

export interface CatalogProduct {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number;
  discountPrice?: number | null;
  storeType: "CLOTHING" | "TATTOO_SHOP";
  isFeatured: boolean;
  images: Array<{
    id: string;
    url: string;
    alt?: string | null;
    isCover: boolean;
  }>;
}

interface ProductCardProps {
  product: CatalogProduct;
  hrefBase: "/tienda" | "/tattoo-shop";
  className?: string;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

export function ProductCard({ product, hrefBase, className }: ProductCardProps) {
  const cover =
    product.images.find((image) => image.isCover)?.url ?? product.images[0]?.url ?? null;
  const price = product.discountPrice ?? product.basePrice;
  const hasDiscount = product.discountPrice != null;
  const lightboxImages = product.images.map((image) => ({
    src: image.url,
    alt: image.alt || product.name,
  }));
  const lightbox = useLightbox(lightboxImages);

  return (
    <article className={cn("group flex flex-col", className)}>
      <div className="overflow-hidden rounded-2xl border border-line bg-elevated">
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
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition duration-700 ease-out group-hover:scale-[1.04]"
              />
              {product.images.length > 1 && (
                <span className="absolute bottom-3 right-3 rounded-full bg-black/60 px-2.5 py-1 text-[0.65rem] font-medium text-white backdrop-blur">
                  {product.images.length} fotos
                </span>
              )}
            </button>
          ) : (
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,var(--brand-soft),transparent_55%),linear-gradient(160deg,var(--elevated),var(--surface))]" />
          )}
          {product.isFeatured && (
            <span className="pointer-events-none absolute left-3 top-3 rounded-full bg-brand px-3 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-brand-fg">
              Destacado
            </span>
          )}
        </div>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <h2 className="font-display text-lg font-semibold tracking-tight text-fg">{product.name}</h2>
        <p className="mt-1 line-clamp-2 text-sm text-muted">{product.description}</p>
        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-semibold text-fg">{formatPrice(price)}</span>
            {hasDiscount && (
              <span className="text-sm text-subtle line-through">{formatPrice(product.basePrice)}</span>
            )}
          </div>
          <Link
            href={`${hrefBase}?p=${product.slug}`}
            className="text-sm font-medium text-brand transition hover:opacity-80"
          >
            Ver
          </Link>
        </div>
      </div>

      <ImageLightbox {...lightbox.props} images={lightboxImages} />
    </article>
  );
}
