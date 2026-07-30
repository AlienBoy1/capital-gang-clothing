import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/shared/lib/get-current-session";
import { prisma } from "@/shared/lib/prisma";

const checkoutItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.coerce.number().int().positive(),
  unitPrice: z.coerce.number().nonnegative(),
});

const publicOrderSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(8),
  country: z.string().min(1),
  state: z.string().min(1),
  municipality: z.string().min(1),
  postalCode: z.string().min(3),
  address: z.string().min(1),
  comments: z.string().optional().nullable(),
  items: z.array(checkoutItemSchema).min(1),
});

function buildOrderCode() {
  const year = new Date().getFullYear();
  const suffix = Math.floor(Math.random() * 9000 + 1000);
  return `CGC-${year}-${suffix}`;
}

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN" && session.role !== "USER") {
    return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  }

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      items: {
        include: { product: { select: { id: true, name: true, slug: true, stock: true } } },
      },
      notes: true,
    },
  });
  return NextResponse.json(orders);
}

/** Public checkout: creates order from cart and returns WhatsApp payload. */
export async function POST(request: Request) {
  const parsed = publicOrderSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const data = parsed.data;
  const subtotal = data.items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

  const productIds = data.items.map((item) => item.productId);
  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true },
  });
  if (products.length !== productIds.length) {
    return NextResponse.json({ message: "Uno o más productos no existen" }, { status: 400 });
  }

  let code = buildOrderCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const exists = await prisma.order.findUnique({ where: { code } });
    if (!exists) break;
    code = buildOrderCode();
  }

  const order = await prisma.order.create({
    data: {
      code,
      customerName: data.customerName,
      customerPhone: data.customerPhone,
      country: data.country,
      state: data.state,
      municipality: data.municipality,
      postalCode: data.postalCode,
      city: data.municipality,
      address: data.address,
      comments: data.comments ?? null,
      subtotal,
      status: "NEW",
      fulfillment: "PENDING",
      items: {
        create: data.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      },
    },
    include: {
      items: { include: { product: { select: { name: true } } } },
    },
  });

  const waSetting = await prisma.appSetting.findUnique({ where: { key: "whatsapp" } });
  const rawPhone = (waSetting?.value || "3310899404").replace(/\D/g, "");
  const whatsapp = rawPhone.startsWith("52") ? rawPhone : `52${rawPhone}`;

  return NextResponse.json({ order, whatsapp }, { status: 201 });
}
