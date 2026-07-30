"use client";

import Image from "next/image";
import { Check, ShoppingBag, X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useCartStore } from "@/modules/cart/presentation/cart.store";
import {
  resolveStockLevel,
  stockLevelLabel,
  stockLevelTone,
  type StockThresholds,
  DEFAULT_STOCK_THRESHOLDS,
} from "@/shared/lib/stock";
import { cn } from "@/shared/lib/cn";
import type { CatalogProduct } from "@/modules/catalog/presentation/components/ProductCard";

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

interface ProductDetailModalProps {
  product: CatalogProduct | null;
  thresholds?: StockThresholds;
  onClose: () => void;
}

export function ProductDetailModal({
  product,
  thresholds = DEFAULT_STOCK_THRESHOLDS,
  onClose,
}: ProductDetailModalProps) {
  const [mounted, setMounted] = useState(false);
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    setActiveImage(0);
    setAdded(false);
  }, [product?.id]);

  useEffect(() => {
    if (!product) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [product, onClose]);

  if (!mounted || !product) return null;

  const cover =
    product.images[activeImage]?.url ??
    product.images.find((image) => image.isCover)?.url ??
    product.images[0]?.url ??
    null;
  const price = product.discountPrice ?? product.basePrice;
  const hasDiscount = product.discountPrice != null;
  const stock = product.stock ?? 0;
  const level = resolveStockLevel(stock, thresholds);

  function handleAdd() {
    addItem({
      productId: product!.id,
      name: product!.name,
      slug: product!.slug,
      price: Number(price),
      image: cover,
      storeType: product!.storeType,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1400);
  }

  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        aria-label="Cerrar ficha"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="product-detail-title"
        className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-line bg-canvas shadow-soft sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
          <p className="section-label">Ficha</p>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-elevated text-fg"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid min-h-0 flex-1 overflow-y-auto lg:grid-cols-2">
          <div className="relative aspect-[4/5] bg-elevated sm:aspect-square lg:aspect-auto lg:min-h-[28rem]">
            {cover ? (
              <Image
                src={cover}
                alt={product.images[activeImage]?.alt || product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-brand-soft" />
            )}
          </div>

          <div className="flex flex-col gap-4 p-5 sm:p-6">
            <div>
              <h2
                id="product-detail-title"
                className="font-display text-2xl font-semibold tracking-tight sm:text-3xl"
              >
                {product.name}
              </h2>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span className="text-lg font-semibold text-fg">{formatPrice(Number(price))}</span>
                {hasDiscount && (
                  <span className="text-sm text-subtle line-through">
                    {formatPrice(product.basePrice)}
                  </span>
                )}
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-1 text-[0.65rem] font-semibold uppercase tracking-[0.12em]",
                    stockLevelTone(level)
                  )}
                >
                  {stockLevelLabel(level)}
                </span>
              </div>
            </div>

            <p className="text-sm leading-relaxed text-muted whitespace-pre-wrap">{product.description}</p>

            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    type="button"
                    onClick={() => setActiveImage(index)}
                    className={cn(
                      "relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border",
                      index === activeImage ? "border-brand" : "border-line"
                    )}
                  >
                    <Image src={image.url} alt="" fill sizes="56px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}

            <div className="mt-auto flex flex-col gap-2 pt-2 sm:flex-row">
              <button
                type="button"
                onClick={handleAdd}
                disabled={level === "out"}
                className={cn(
                  "inline-flex flex-1 items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition",
                  level === "out"
                    ? "cursor-not-allowed bg-elevated text-subtle"
                    : "bg-brand text-brand-fg hover:opacity-90"
                )}
              >
                {added ? <Check size={16} /> : <ShoppingBag size={16} />}
                {level === "out" ? "Agotado" : added ? "Agregado" : "Agregar al carrito"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-fg"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
