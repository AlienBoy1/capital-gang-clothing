"use client";

import { useCallback, useEffect, useState } from "react";
import { Button } from "@/shared/ui/components/Button";

interface OrderProduct {
  id: string;
  name: string;
  stock: number;
}

interface OrderLine {
  id: string;
  quantity: number;
  unitPrice: number | string;
  product: OrderProduct;
}

interface OrderItem {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  country?: string;
  address: string;
  city: string;
  municipality?: string;
  postalCode?: string;
  state: string;
  comments?: string | null;
  status: string;
  fulfillment: "PENDING" | "QUOTE" | "SALE";
  stockDeducted: boolean;
  subtotal: number | string;
  items: OrderLine[];
}

function fulfillmentLabel(value: OrderItem["fulfillment"]) {
  switch (value) {
    case "SALE":
      return "Venta";
    case "QUOTE":
      return "Cotización";
    default:
      return "Pendiente";
  }
}

export function OrdersManager() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmSale, setConfirmSale] = useState<OrderItem | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = useCallback(async () => {
    const res = await fetch("/api/orders");
    if (res.ok) setOrders(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  async function setFulfillment(order: OrderItem, fulfillment: "QUOTE" | "SALE", confirmed = false) {
    setBusyId(order.id);
    setError(null);
    try {
      const res = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fulfillment, confirmSale: confirmed }),
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 428 && data.code === "CONFIRM_SALE_REQUIRED") {
        setConfirmSale(order);
        return;
      }
      if (!res.ok) {
        setError(data.message ?? "No se pudo actualizar la orden");
        return;
      }

      setConfirmSale(null);
      await loadOrders();
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton h-24" />
        ))}
      </div>
    );
  }

  if (!orders.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-sm text-muted">
        No hay órdenes todavía.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error && <p className="text-sm text-danger">{error}</p>}

      {orders.map((order) => (
        <div key={order.id} className="panel space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-fg">{order.code}</h3>
              <p className="mt-1 text-sm text-muted">
                {order.customerName} · {order.customerPhone}
              </p>
              <p className="mt-1 text-xs text-subtle">
                {[
                  order.address,
                  order.postalCode ? `CP ${order.postalCode}` : null,
                  order.municipality || order.city,
                  order.state,
                  order.country,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
              {order.comments && <p className="mt-2 text-xs text-muted">Notas: {order.comments}</p>}
            </div>
            <div className="text-right text-sm">
              <p className="rounded-full bg-elevated px-3 py-1 text-xs uppercase tracking-wide text-fg">
                {fulfillmentLabel(order.fulfillment)}
              </p>
              <p className="mt-2 font-semibold text-fg">
                ${Number(order.subtotal).toLocaleString("es-MX")}
              </p>
            </div>
          </div>

          <ul className="space-y-1 border-t border-line pt-3 text-sm text-muted">
            {order.items?.map((item) => (
              <li key={item.id} className="flex justify-between gap-3">
                <span>
                  {item.product?.name ?? "Producto"} × {item.quantity}
                </span>
                <span>${Number(item.unitPrice).toLocaleString("es-MX")}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant={order.fulfillment === "QUOTE" ? "primary" : "secondary"}
              isLoading={busyId === order.id}
              onClick={() => setFulfillment(order, "QUOTE")}
              disabled={order.fulfillment === "QUOTE"}
            >
              Marcar cotización
            </Button>
            <Button
              type="button"
              size="sm"
              variant={order.fulfillment === "SALE" ? "primary" : "secondary"}
              isLoading={busyId === order.id}
              onClick={() => setFulfillment(order, "SALE")}
              disabled={order.fulfillment === "SALE" && order.stockDeducted}
            >
              Marcar venta
            </Button>
          </div>
        </div>
      ))}

      {confirmSale && (
        <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/70 p-4 sm:items-center">
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-2xl border border-line bg-canvas p-6 shadow-soft"
          >
            <h3 className="font-display text-xl font-semibold">¿La venta ya está concreta?</h3>
            <p className="mt-2 text-sm text-muted">
              Al confirmar, se descontará del stock la cantidad pedida en la orden{" "}
              <strong className="text-fg">{confirmSale.code}</strong>. Esta acción no se puede
              deshacer automáticamente.
            </p>
            <ul className="mt-4 space-y-1 text-sm text-muted">
              {confirmSale.items?.map((item) => (
                <li key={item.id}>
                  {item.product?.name} × {item.quantity}
                </li>
              ))}
            </ul>
            <div className="mt-6 flex flex-col gap-2 sm:flex-row">
              <Button
                type="button"
                className="flex-1"
                isLoading={busyId === confirmSale.id}
                onClick={() => setFulfillment(confirmSale, "SALE", true)}
              >
                Sí, confirmar venta
              </Button>
              <Button
                type="button"
                variant="secondary"
                className="flex-1"
                onClick={() => setConfirmSale(null)}
              >
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
