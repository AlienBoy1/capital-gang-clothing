import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/shared/lib/get-current-session";
import { prisma } from "@/shared/lib/prisma";

const orderSchema = z.object({
  code: z.string().min(1),
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  address: z.string().min(1),
  city: z.string().min(1),
  state: z.string().min(1),
  subtotal: z.coerce.number().nonnegative(),
  status: z.enum(["NEW", "PENDING", "CONTACTED", "IN_PROGRESS", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]).optional(),
});

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ message: "No autorizado" }, { status: 403 });

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true, notes: true },
  });
  return NextResponse.json(orders);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ message: "No autorizado" }, { status: 403 });

  const parsed = orderSchema.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });

  const order = await prisma.order.create({
    data: {
      ...parsed.data,
      subtotal: parsed.data.subtotal,
      status: parsed.data.status ?? "NEW",
    },
  });

  return NextResponse.json(order, { status: 201 });
}
