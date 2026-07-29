import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/shared/lib/get-current-session";
import { prisma } from "@/shared/lib/prisma";

const albumSchema = z.object({
  title: z.string().min(1).optional(),
  slug: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  style: z.string().min(1).optional(),
  coverImage: z.string().optional().nullable(),
  isFeatured: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
  photos: z
    .array(
      z.object({
        url: z.string().min(1),
        alt: z.string().optional().nullable(),
        isCover: z.boolean().optional(),
      })
    )
    .optional(),
});

export async function PUT(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ message: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const parsed = albumSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { photos, ...data } = parsed.data;

  const album = await prisma.$transaction(async (tx) => {
    if (photos) {
      await tx.galleryPhoto.deleteMany({ where: { albumId: id } });
      if (photos.length) {
        await tx.galleryPhoto.createMany({
          data: photos.map((photo, index) => ({
            albumId: id,
            url: photo.url,
            alt: photo.alt ?? null,
            order: index,
            isCover: photo.isCover ?? index === 0,
          })),
        });
        if (!data.coverImage) {
          data.coverImage = photos[0]?.url ?? null;
        }
      }
    }

    return tx.galleryAlbum.update({
      where: { id },
      data,
      include: { photos: { orderBy: { order: "asc" } } },
    });
  });

  return NextResponse.json(album);
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ message: "No autorizado" }, { status: 403 });

  const { id } = await params;
  await prisma.galleryAlbum.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
