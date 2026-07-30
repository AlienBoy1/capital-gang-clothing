import { Suspense } from "react";
import { ProductManager } from "./ProductManager";

export default function ProductosPage() {
  return (
    <Suspense fallback={<div className="skeleton h-64 rounded-2xl" />}>
      <ProductManager storeType="CLOTHING" title="Ropa" />
    </Suspense>
  );
}
