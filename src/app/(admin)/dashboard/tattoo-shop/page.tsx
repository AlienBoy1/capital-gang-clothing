import { Suspense } from "react";
import { ProductManager } from "../productos/ProductManager";

export default function TattooShopAdminPage() {
  return (
    <Suspense fallback={<div className="skeleton h-64 rounded-2xl" />}>
      <ProductManager storeType="TATTOO_SHOP" title="Tattoo Shop" />
    </Suspense>
  );
}