"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useEffect, useState } from "react";
import { useCartStore } from "@/modules/cart/presentation/cart.store";

export function CartButton() {
  const items = useCartStore((state) => state.items);
  const [ready, setReady] = useState(false);

  useEffect(() => setReady(true), []);

  const count = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Link
      href="/carrito"
      className="relative inline-flex h-10 w-10 items-center justify-center rounded-lg border border-line bg-elevated text-fg transition hover:border-line-strong"
      aria-label={`Carrito${ready && count ? `, ${count} productos` : ""}`}
    >
      <ShoppingBag size={16} />
      {ready && count > 0 && (
        <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-[0.65rem] font-bold text-brand-fg">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}
