"use client";

import Image from "next/image";
import { Pencil, Trash2, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { ImageUploader } from "@/shared/ui/components/ImageUploader";
import { ImageLightbox } from "@/shared/ui/components/ImageLightbox";
import { Button } from "@/shared/ui/components/Button";

interface ProductImage {
  id?: string;
  url: string;
  alt?: string | null;
  isCover?: boolean;
}

interface ProductItem {
  id: string;
  name: string;
  slug: string;
  description: string;
  basePrice: number | string;
  discountPrice?: number | string | null;
  stock?: number;
  storeType: "CLOTHING" | "TATTOO_SHOP";
  isActive: boolean;
  isFeatured: boolean;
  images: ProductImage[];
}

interface ProductManagerProps {
  storeType?: "CLOTHING" | "TATTOO_SHOP" | "ALL";
  title?: string;
}

const emptyForm = {
  storeType: "CLOTHING" as "CLOTHING" | "TATTOO_SHOP",
  name: "",
  slug: "",
  description: "",
  basePrice: "",
  discountPrice: "",
  stock: "0",
  isActive: true,
  isFeatured: false,
};

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function ProductManager({ storeType = "ALL", title }: ProductManagerProps) {
  const lockedType = storeType === "ALL" ? null : storeType;
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [images, setImages] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    ...emptyForm,
    storeType: lockedType ?? "CLOTHING",
  });
  const [viewer, setViewer] = useState<{
    images: Array<{ src: string; alt?: string }>;
    index: number;
  } | null>(null);

  const loadProducts = useCallback(async () => {
    setLoading(true);
    const query = lockedType ? `?storeType=${lockedType}` : "";
    const res = await fetch(`/api/products${query}`);
    if (res.ok) setProducts(await res.json());
    setLoading(false);
  }, [lockedType]);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyForm, storeType: lockedType ?? "CLOTHING" });
    setImages([]);
    setError(null);
  }

  function startEdit(product: ProductItem) {
    setEditingId(product.id);
    setForm({
      storeType: product.storeType,
      name: product.name,
      slug: product.slug,
      description: product.description,
      basePrice: String(product.basePrice),
      discountPrice: product.discountPrice != null ? String(product.discountPrice) : "",
      stock: String(product.stock ?? 0),
      isActive: product.isActive,
      isFeatured: product.isFeatured,
    });
    setImages(product.images?.map((image) => image.url) ?? []);
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const payload = {
      ...form,
      storeType: lockedType ?? form.storeType,
      basePrice: Number(form.basePrice),
      discountPrice: form.discountPrice ? Number(form.discountPrice) : null,
      stock: Number(form.stock || 0),
      images: images.map((url, index) => ({
        url,
        alt: form.name,
        isCover: index === 0,
      })),
    };

    const res = await fetch(editingId ? `/api/products/${editingId}` : "/api/products", {
      method: editingId ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.message ?? "No se pudo guardar el producto");
      setSaving(false);
      return;
    }

    resetForm();
    setSaving(false);
    loadProducts();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este producto?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (editingId === id) resetForm();
      loadProducts();
    }
  }

  function openProductImages(product: ProductItem, at = 0) {
    const imgs = (product.images ?? []).map((image) => ({
      src: image.url,
      alt: image.alt || product.name,
    }));
    if (!imgs.length) return;
    setViewer({ images: imgs, index: at });
  }

  return (
    <div className="space-y-8">
      {title && (
        <div>
          <h1 className="font-display text-2xl font-semibold tracking-tight">{title}</h1>
          <p className="mt-1 text-sm text-muted">
            Crea, edita y adjunta imágenes. Toca cualquier foto para verla a pantalla completa.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="panel space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-fg">
            {editingId ? "Editando producto" : "Nuevo producto"}
          </p>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted transition hover:text-fg"
            >
              <X size={14} />
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => {
              const name = e.target.value;
              setForm((prev) => ({
                ...prev,
                name,
                slug:
                  editingId || (prev.slug && prev.slug !== slugify(prev.name))
                    ? prev.slug
                    : slugify(name),
              }));
            }}
            placeholder="Nombre"
            required
            className="input-field"
          />
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="Slug"
            required
            className="input-field"
          />
          {!lockedType && (
            <select
              value={form.storeType}
              onChange={(e) => setForm({ ...form, storeType: e.target.value as "CLOTHING" | "TATTOO_SHOP" })}
              className="input-field"
            >
              <option value="CLOTHING">Ropa</option>
              <option value="TATTOO_SHOP">Tattoo Shop</option>
            </select>
          )}
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.basePrice}
            onChange={(e) => setForm({ ...form, basePrice: e.target.value })}
            placeholder="Precio base"
            required
            className="input-field"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            value={form.discountPrice}
            onChange={(e) => setForm({ ...form, discountPrice: e.target.value })}
            placeholder="Precio oferta (opcional)"
            className="input-field"
          />
          <input
            type="number"
            min="0"
            step="1"
            value={form.stock}
            onChange={(e) => setForm({ ...form, stock: e.target.value })}
            placeholder="Stock"
            required
            className="input-field"
          />
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
            />
            Activo
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <input
              type="checkbox"
              checked={form.isFeatured}
              onChange={(e) => setForm({ ...form, isFeatured: e.target.checked })}
            />
            Destacado
          </label>
        </div>

        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descripción"
          required
          className="input-field min-h-28"
        />

        <ImageUploader value={images} onChange={setImages} label="Imágenes del producto" />

        {error && <p className="text-sm text-danger">{error}</p>}

        <Button type="submit" isLoading={saving}>
          {editingId ? "Actualizar producto" : "Guardar producto"}
        </Button>
      </form>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Catálogo ({products.length})</h2>
        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-40" />
            ))}
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-sm text-muted">
            Aún no hay productos. Crea el primero con imágenes.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {products.map((product) => {
              const cover = product.images?.[0]?.url;
              const isEditing = editingId === product.id;
              return (
                <div
                  key={product.id}
                  className={`panel flex gap-4 p-4 ${isEditing ? "border-brand/50 ring-1 ring-brand/30" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => openProductImages(product)}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-elevated"
                    disabled={!cover}
                    aria-label="Abrir imágenes"
                  >
                    {cover ? (
                      <Image src={cover} alt={product.name} fill sizes="80px" className="object-cover" />
                    ) : (
                      <div className="absolute inset-0 bg-brand-soft" />
                    )}
                  </button>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="truncate font-semibold text-fg">{product.name}</h3>
                        <p className="mt-1 line-clamp-2 text-xs text-muted">{product.description}</p>
                      </div>
                      <div className="flex shrink-0 gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(product)}
                          className="rounded-lg p-2 text-muted transition hover:bg-elevated hover:text-brand"
                          aria-label="Editar"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(product.id)}
                          className="rounded-lg p-2 text-muted transition hover:bg-elevated hover:text-danger"
                          aria-label="Eliminar"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-subtle">
                      <span className="rounded-full bg-elevated px-2 py-1 text-fg">
                        ${Number(product.basePrice).toLocaleString("es-MX")}
                      </span>
                      <span className="rounded-full bg-elevated px-2 py-1 text-fg">
                        Stock: {product.stock ?? 0}
                      </span>
                      <span>{product.images?.length ?? 0} img</span>
                      {product.isFeatured && <span className="text-brand">Destacado</span>}
                      {!product.isActive && <span className="text-danger">Inactivo</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ImageLightbox
        open={Boolean(viewer)}
        images={viewer?.images ?? []}
        index={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
        onIndexChange={(index) => setViewer((current) => (current ? { ...current, index } : null))}
      />
    </div>
  );
}
