import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/shared/lib/get-current-session";
import { prisma } from "@/shared/lib/prisma";

const productSchema = z.object({
  storeType: z.enum(["CLOTHING", "TATTOO_SHOP"]),
  name: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().min(1),
  basePrice: z.coerce.number().nonnegative(),
  discountPrice: z.coerce.number().nonnegative().nullable().optional(),
  isActive: z.boolean().optional(),
  isFeatured: z.boolean().optional(),
  images: z
    .array(
      z.object({
        url: z.string().min(1),
        alt: z.string().optional().nullable(),
        isCover: z.boolean().optional(),
      })
    )
    .optional(),
});

export async function GET(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ message: "No autorizado" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const storeType = searchParams.get("storeType") as "CLOTHING" | "TATTOO_SHOP" | null;

  const products = await prisma.product.findMany({
    where: storeType ? { storeType } : undefined,
    orderBy: { createdAt: "desc" },
    include: { images: { orderBy: { order: "asc" } }, variants: true },
  });

  return NextResponse.json(products);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ message: "No autorizado" }, { status: 403 });

  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { images = [], ...data } = parsed.data;

  const product = await prisma.product.create({
    data: {
      ...data,
      discountPrice: data.discountPrice ?? null,
      isActive: data.isActive ?? true,
      isFeatured: data.isFeatured ?? false,
      createdById: session.userId,
      images: images.length
        ? {
            create: images.map((image, index) => ({
              url: image.url,
              alt: image.alt ?? null,
              order: index,
              isCover: image.isCover ?? index === 0,
            })),
          }
        : undefined,
    },
    include: { images: true },
  });

  return NextResponse.json(product, { status: 201 });
}
