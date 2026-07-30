import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/shared/lib/get-current-session";
import { prisma } from "@/shared/lib/prisma";

const patchSchema = z.object({
  fulfillment: z.enum(["QUOTE", "SALE"]),
  confirmSale: z.boolean().optional(),
});

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ message: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const parsed = patchSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos" }, { status: 400 });
  }

  const order = await prisma.order.findUnique({
    where: { id },
    include: { items: true },
  });
  if (!order) return NextResponse.json({ message: "Orden no encontrada" }, { status: 404 });

  const { fulfillment, confirmSale } = parsed.data;

  // Cotización: never touches stock
  if (fulfillment === "QUOTE") {
    const updated = await prisma.order.update({
      where: { id },
      data: { fulfillment: "QUOTE" },
      include: {
        items: { include: { product: { select: { id: true, name: true, stock: true } } } },
      },
    });
    return NextResponse.json(updated);
  }

  // SALE from QUOTE or PENDING requires confirmation when stock will be deducted
  const willDeduct = !order.stockDeducted;
  if (willDeduct && !confirmSale) {
    return NextResponse.json(
      {
        code: "CONFIRM_SALE_REQUIRED",
        message: "Confirma que la venta ya está concreta para descontar stock.",
      },
      { status: 428 }
    );
  }

  const updated = await prisma.$transaction(async (tx) => {
    if (willDeduct) {
      for (const item of order.items) {
        await tx.product.update({
          where: { id: item.productId },
          data: { stock: { decrement: item.quantity } },
        });
        // Clamp at 0 if went negative
        const product = await tx.product.findUnique({ where: { id: item.productId } });
        if (product && product.stock < 0) {
          await tx.product.update({ where: { id: item.productId }, data: { stock: 0 } });
        }
      }
    }

    return tx.order.update({
      where: { id },
      data: {
        fulfillment: "SALE",
        stockDeducted: true,
        status: order.status === "NEW" || order.status === "PENDING" ? "PAID" : order.status,
      },
      include: {
        items: { include: { product: { select: { id: true, name: true, stock: true } } } },
      },
    });
  });

  await prisma.activityLog.create({
    data: {
      userId: session.userId,
      action: "order.marked_sale",
      entityType: "Order",
      entityId: id,
      metadata: { stockDeducted: willDeduct },
    },
  });

  return NextResponse.json(updated);
}
