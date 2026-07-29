import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/shared/lib/get-current-session";
import { prisma } from "@/shared/lib/prisma";

const productSchema = z.object({
  storeType: z.enum(["CLOTHING", "TATTOO_SHOP"]).optional(),
  name: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  basePrice: z.coerce.number().nonnegative().optional(),
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

async function requireAdmin() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ message: "No autorizado" }, { status: 403 });
  return null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const product = await prisma.product.findUnique({
    where: { id },
    include: { images: { orderBy: { order: "asc" } }, variants: true },
  });
  if (!product) return NextResponse.json({ message: "No encontrado" }, { status: 404 });

  return NextResponse.json(product);
}

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  const parsed = productSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { images, ...data } = parsed.data;

  const product = await prisma.$transaction(async (tx) => {
    if (images) {
      await tx.productImage.deleteMany({ where: { productId: id } });
      if (images.length) {
        await tx.productImage.createMany({
          data: images.map((image, index) => ({
            productId: id,
            url: image.url,
            alt: image.alt ?? null,
            order: index,
            isCover: image.isCover ?? index === 0,
          })),
        });
      }
    }

    return tx.product.update({
      where: { id },
      data,
      include: { images: { orderBy: { order: "asc" } } },
    });
  });

  return NextResponse.json(product);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const denied = await requireAdmin();
  if (denied) return denied;

  const { id } = await params;
  await prisma.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
