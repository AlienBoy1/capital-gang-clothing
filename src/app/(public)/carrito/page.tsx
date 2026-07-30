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

export default function CarritoPage() {
  const items = useCartStore((state) => state.items);
  const setQuantity = useCartStore((state) => state.setQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clear = useCartStore((state) => state.clear);
  const subtotal = useCartStore((state) => state.subtotal);
  const [ready, setReady] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => setReady(true), []);

  function checkoutWhatsApp() {
    const lines = items.map(
      (item) => `• ${item.name} x${item.quantity} — ${formatPrice(item.price * item.quantity)}`
    );
    const message = [
      "Hola Capital Gang, quiero hacer este pedido:",
      "",
      ...lines,
      "",
      `Subtotal: ${formatPrice(subtotal())}`,
      name ? `Nombre: ${name}` : null,
      phone ? `Teléfono: ${phone}` : null,
      note ? `Notas: ${note}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/525500000000?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
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
        Revisa tus piezas y envía el pedido por WhatsApp. Confirmamos stock y envío contigo.
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
            <button type="button" onClick={clear} className="text-sm text-muted underline-offset-2 hover:text-fg hover:underline">
              Vaciar carrito
            </button>
          </div>

          <aside className="panel h-fit space-y-4 lg:sticky lg:top-24">
            <h2 className="font-display text-xl font-semibold">Checkout</h2>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted">Subtotal</span>
              <span className="font-semibold text-fg">{formatPrice(subtotal())}</span>
            </div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Tu nombre"
              className="input-field"
            />
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="WhatsApp"
              className="input-field"
            />
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Notas (talla, color, dirección…)"
              className="input-field min-h-24"
            />
            <Button type="button" className="w-full" size="lg" onClick={checkoutWhatsApp}>
              Pedir por WhatsApp
            </Button>
            <p className="text-xs text-subtle">
              No pagas aquí. Te confirmamos disponibilidad y envío por mensaje.
            </p>
          </aside>
        </div>
      )}
    </main>
  );
}
