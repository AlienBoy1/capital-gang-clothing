/** Convert Prisma Decimal / Date values into plain JSON-safe objects for Client Components. */
export function toPlainNumber(value: unknown): number {
  if (typeof value === "number") return value;
  if (value == null) return 0;
  if (typeof value === "object" && value !== null && "toNumber" in value) {
    return (value as { toNumber: () => number }).toNumber();
  }
  return Number(String(value));
}

export function serializeProduct<T extends Record<string, unknown>>(product: T) {
  const images = Array.isArray(product.images) ? product.images : [];

  return {
    id: String(product.id),
    storeType: product.storeType as "CLOTHING" | "TATTOO_SHOP",
    name: String(product.name),
    slug: String(product.slug),
    description: String(product.description),
    basePrice: toPlainNumber(product.basePrice),
    discountPrice:
      product.discountPrice == null ? null : toPlainNumber(product.discountPrice),
    isActive: Boolean(product.isActive),
    isFeatured: Boolean(product.isFeatured),
    images: images.map((image) => {
      const item = image as Record<string, unknown>;
      return {
        id: String(item.id),
        url: String(item.url),
        alt: (item.alt as string | null) ?? null,
        isCover: Boolean(item.isCover),
      };
    }),
  };
}

export function serializeProducts<T extends Record<string, unknown>>(products: T[]) {
  return products.map((product) => serializeProduct(product));
}
