"use client";

import { useEffect, useState } from "react";

interface OrderItem {
  id: string;
  code: string;
  customerName: string;
  customerPhone: string;
  address: string;
  city: string;
  state: string;
  status: string;
  subtotal: number | string;
}

export function OrdersManager() {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/orders")
      .then((res) => (res.ok ? res.json() : []))
      .then((data) => setOrders(data))
      .finally(() => setLoading(false));
  }, []);

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
    <div className="space-y-3">
      {orders.map((order) => (
        <div key={order.id} className="panel">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-fg">{order.code}</h3>
              <p className="mt-1 text-sm text-muted">
                {order.customerName} · {order.customerPhone}
              </p>
              <p className="mt-1 text-xs text-subtle">
                {order.address}, {order.city}, {order.state}
              </p>
            </div>
            <div className="text-right text-sm">
              <p className="rounded-full bg-elevated px-3 py-1 text-xs uppercase tracking-wide text-fg">
                {order.status}
              </p>
              <p className="mt-2 font-semibold text-fg">${Number(order.subtotal).toLocaleString("es-MX")}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
