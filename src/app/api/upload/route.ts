import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import sharp from "sharp";
import { getCurrentSession } from "@/shared/lib/get-current-session";

export const runtime = "nodejs";

const MAX_FILES = 8;
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

export async function POST(request: Request) {
  const session = await getCurrentSession();
  if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
  if (session.role !== "ADMIN") return NextResponse.json({ message: "No autorizado" }, { status: 403 });

  const formData = await request.formData();
  const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

  if (!files.length) {
    return NextResponse.json({ message: "No se enviaron archivos" }, { status: 400 });
  }
  if (files.length > MAX_FILES) {
    return NextResponse.json({ message: `Máximo ${MAX_FILES} archivos por carga` }, { status: 400 });
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });

  const urls: string[] = [];

  for (const file of files) {
    if (!ALLOWED.has(file.type)) {
      return NextResponse.json({ message: `Tipo no permitido: ${file.type || file.name}` }, { status: 400 });
    }
    if (file.size > MAX_BYTES) {
      return NextResponse.json({ message: `${file.name} supera 8MB` }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const id = nanoid(12);
    const filename = `${id}.webp`;
    const output = path.join(uploadDir, filename);

    try {
      const optimized = await sharp(buffer)
        .rotate()
        .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 82 })
        .toBuffer();
      await writeFile(output, optimized);
    } catch {
      // Fallback without sharp transform if format is unusual
      const fallbackName = `${id}${path.extname(file.name) || ".bin"}`;
      await writeFile(path.join(uploadDir, fallbackName), buffer);
      urls.push(`/uploads/${fallbackName}`);
      continue;
    }

    urls.push(`/uploads/${filename}`);
  }

  return NextResponse.json({ urls }, { status: 201 });
}
