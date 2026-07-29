import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/shared/lib/get-current-session";
import { prisma } from "@/shared/lib/prisma";

const photosSchema = z.object({
  photos: z.array(
    z.object({
      url: z.string().min(1),
      alt: z.string().optional().nullable(),
      isCover: z.boolean().optional(),
    })
  ),
  replace: z.boolean().optional(),
});

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ message: "No autorizado" }, { status: 403 });

  const { id } = await params;
  const album = await prisma.galleryAlbum.findUnique({ where: { id } });
  if (!album) return NextResponse.json({ message: "Álbum no encontrado" }, { status: 404 });

  const parsed = photosSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const { photos, replace = false } = parsed.data;

  const updated = await prisma.$transaction(async (tx) => {
    if (replace) {
      await tx.galleryPhoto.deleteMany({ where: { albumId: id } });
    }

    const existingCount = replace
      ? 0
      : await tx.galleryPhoto.count({ where: { albumId: id } });

    await tx.galleryPhoto.createMany({
      data: photos.map((photo, index) => ({
        albumId: id,
        url: photo.url,
        alt: photo.alt ?? null,
        order: existingCount + index,
        isCover: photo.isCover ?? (existingCount === 0 && index === 0),
      })),
    });

    const cover = photos[0]?.url;
    if (cover && (replace || !album.coverImage)) {
      await tx.galleryAlbum.update({
        where: { id },
        data: { coverImage: cover },
      });
    }

    return tx.galleryAlbum.findUnique({
      where: { id },
      include: { photos: { orderBy: { order: "asc" } } },
    });
  });

  return NextResponse.json(updated, { status: 201 });
}
