"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useCartStore } from "@/modules/cart/presentation/cart.store";
import { Button } from "@/shared/ui/components/Button";

function formatPrice(value: number) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    maximumFractionDigits: 0,
  }).format(value);
}

const emptyForm = {
  name: "",
  phone: "",
  country: "Mexico",
  state: "",
  municipality: "",
  address: "",
  note: "",
};

export default function CarritoPage() {
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clear = useCartStore((state) => state.clear);
  const subtotal = useCartStore((state) => state.subtotal);
  const [ready, setReady] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => setReady(true), []);

  async function checkoutWhatsApp() {
    setError(null);
    if (!form.name.trim() || !form.phone.trim()) {
      setError("Nombre y WhatsApp son obligatorios.");
      return;
    }
    if (!form.country.trim() || !form.state.trim() || !form.municipality.trim() || !form.address.trim()) {
      setError("Completa país, estado, municipio y calle y número.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          country: form.country.trim(),
          state: form.state.trim(),
          municipality: form.municipality.trim(),
          address: form.address.trim(),
          comments: form.note.trim() || null,
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.price,
          })),
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.message ?? "No se pudo crear la orden");
        return;
      }

      const lines = items.map(
        (item) => `• ${item.name} x${item.quantity} — ${formatPrice(item.price * item.quantity)}`
      );
      const message = [
        `Hola Capital Gang, quiero hacer este pedido (${data.order.code}):`,
        "",
        ...lines,
        "",
        `Subtotal: ${formatPrice(subtotal())}`,
        "",
        `Nombre: ${form.name}`,
        `WhatsApp: ${form.phone}`,
        `País: ${form.country}`,
        `Estado: ${form.state}`,
        `Municipio: ${form.municipality}`,
        `Calle y número: ${form.address}`,
        form.note ? `Notas: ${form.note}` : null,
      ]
        .filter(Boolean)
        .join("\n");

      const url = `https://wa.me/${data.whatsapp}?text=${encodeURIComponent(message)}`;
      window.open(url, "_blank", "noopener,noreferrer");
      clear();
      setForm(emptyForm);
    } finally {
      setSubmitting(false);
    }
  }

  if (!ready) {
    return (
      <main className="page-shell py-12">
        <div className="skeleton h-40" />
      </main>
    );
  }

  return (
    <main className="page-shell py-10 sm:py-16">
      <p className="section-label">Carrito</p>
      <h1 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-5xl">Tu pedido</h1>
      <p className="mt-3 max-w-xl text-muted">
        Revisa tus piezas, completa tus datos y envía el pedido por WhatsApp. Se genera la orden
        automáticamente para el equipo.
      </p>

      {items.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold">El carrito está vacío</p>
          <p className="mt-2 text-sm text-muted">Explora la tienda o el tattoo shop y agrega piezas.</p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/tienda" className="rounded-full bg-brand px-5 py-3 text-sm font-semibold text-brand-fg">
              Ir a tienda
            </Link>
            <Link
              href="/tattoo-shop"
              className="rounded-full border border-line px-5 py-3 text-sm font-semibold text-fg"
            >
              Tattoo Shop
            </Link>
          </div>
        </div>
      ) : (
        <div className="mt-10 grid gap-8 lg:grid-cols-[1.4fr_0.8fr]">
          <div className="space-y-3">
            {items.map((item) => (
              <div key={item.productId} className="panel flex gap-3 p-3 sm:gap-4 sm:p-4">
                <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-elevated sm:h-28 sm:w-24">
                  {item.image ? (
                    <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />
                  ) : (
                    <div className="absolute inset-0 bg-brand-soft" />
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-semibold text-fg">{item.name}</h2>
                      <p className="mt-1 text-xs text-subtle">
                        {item.storeType === "CLOTHING" ? "Ropa" : "Tattoo Shop"}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="rounded-lg p-2 text-muted hover:bg-elevated hover:text-danger"
                      aria-label="Quitar"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
                    <div className="inline-flex items-center rounded-full border border-line">
                      <button
                        type="button"
                        className="px-3 py-1.5 text-muted hover:text-fg"
                        onClick={() => setQuantity(item.productId, item.quantity - 1)}
                        aria-label="Menos"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-8 text-center text-sm font-semibold">{item.quantity}</span>
                      <button
                        type="button"
                        className="px-3 py-1.5 text-muted hover:text-fg"
                        onClick={() => setQuantity(item.productId, item.quantity + 1)}
                        aria-label="Más"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    <p className="font-semibold text-fg">{formatPrice(item.price * item.quantity)}</p>
                  </div>
                </div>
              </div>
            ))}
            <button
              type="button"
              onClick={clear}
              className="text-sm text-muted underline-offset-2 hover:text-fg hover:underline"
            >
              Vaciar carrito
            </button>
          </div>

          <aside className="panel h-fit space-y-3 lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-semibold">Checkout</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold text-fg">{formatPrice(subtotal())}</span>
            </div>
            <input
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Tu nombre *"
              className="input-field"
              required
            />
            <input
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="WhatsApp *"
              className="input-field"
              required
            />
            <input
              value={form.country}
              onChange={(e) => setForm({ ...form, country: e.target.value })}
              placeholder="País *"
              className="input-field"
              required
            />
            <input
              value={form.state}
              onChange={(e) => setForm({ ...form, state: e.target.value })}
              placeholder="Estado *"
              className="input-field"
              required
            />
            <input
              value={form.municipality}
              onChange={(e) => setForm({ ...form, municipality: e.target.value })}
              placeholder="Municipio *"
              className="input-field"
              required
            />
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
              placeholder="Calle y número *"
              className="input-field"
              required
            />
            <textarea
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              placeholder="Notas (talla, color, referencias…)"
              className="input-field min-h-24"
            />
            {error && <p className="text-xs text-danger">{error}</p>}
            <Button
              type="button"
              className="w-full"
              size="lg"
              isLoading={submitting}
              onClick={checkoutWhatsApp}
            >
              Pedir por WhatsApp
            </Button>
            <p className="text-xs text-subtle">
              Al enviar se crea la orden en el panel y se abre WhatsApp con el detalle.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
