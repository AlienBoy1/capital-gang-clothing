import { OrdersManager } from "./OrdersManager";

export default function OrdenesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Órdenes</h1>
        <p className="mt-1 text-sm text-muted">Revisa pedidos, estados y próximos envíos.</p>
      </div>
      <OrdersManager />
    </div>
  );
}
