import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentSession } from "@/shared/lib/get-current-session";
import { prisma } from "@/shared/lib/prisma";

const albumSchema = z.object({
  title: z.string().min(1),
  slug: z.string().min(1),
  description: z.string().optional(),
  style: z.string().min(1),
  coverImage: z.string().optional(),
  isFeatured: z.boolean().optional(),
  order: z.coerce.number().int().optional(),
});

export async function GET() {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ message: "No autorizado" }, { status: 403 });

  const albums = await prisma.galleryAlbum.findMany({
    orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    include: { photos: true },
  });
  return NextResponse.json(albums);
}

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ message: "No autorizado" }, { status: 403 });

  const parsed = albumSchema.safeParse(await request.json());
  if (!parsed.success) {
    return NextResponse.json({ message: "Datos inválidos", issues: parsed.error.issues }, { status: 400 });
  }

  const album = await prisma.galleryAlbum.create({ data: parsed.data });
  return NextResponse.json(album, { status: 201 });
}
