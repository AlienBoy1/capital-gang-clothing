import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";
import sharp from "sharp";
import { getCurrentSession } from "@/shared/lib/get-current-session";

export const runtime = "nodejs";

const MAX_FILES = 8;
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"]);

async function optimizeToWebp(buffer: Buffer) {
  return sharp(buffer)
    .rotate()
    .resize({ width: 1800, height: 1800, fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82 })
    .toBuffer();
}

async function storeFile(filename: string, data: Buffer, contentType: string) {
  // Production (Vercel): durable Blob storage — local disk is ephemeral/read-only
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`uploads/${filename}`, data, {
      access: "public",
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return blob.url;
  }

  // Local development fallback
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, filename), data);
  return `/uploads/${filename}`;
}

export async function POST(request: Request) {
  try {
    const session = await getCurrentSession();
    if (!session) return NextResponse.json({ message: "No autenticado" }, { status: 401 });
    if (session.role !== "ADMIN") return NextResponse.json({ message: "No autorizado" }, { status: 403 });

    if (process.env.VERCEL && !process.env.BLOB_READ_WRITE_TOKEN) {
      return NextResponse.json(
        {
          message:
            "Falta BLOB_READ_WRITE_TOKEN. Crea un Blob Store en Vercel y agrega el token al proyecto.",
        },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const files = formData.getAll("files").filter((entry): entry is File => entry instanceof File);

    if (!files.length) {
      return NextResponse.json({ message: "No se enviaron archivos" }, { status: 400 });
    }
    if (files.length > MAX_FILES) {
      return NextResponse.json({ message: `Máximo ${MAX_FILES} archivos por carga` }, { status: 400 });
    }

    const urls: string[] = [];

    for (const file of files) {
      if (!ALLOWED.has(file.type)) {
        return NextResponse.json(
          { message: `Tipo no permitido: ${file.type || file.name}` },
          { status: 400 }
        );
      }
      if (file.size > MAX_BYTES) {
        return NextResponse.json({ message: `${file.name} supera 8MB` }, { status: 400 });
      }

      const buffer = Buffer.from(await file.arrayBuffer());
      const id = nanoid(12);

      try {
        const optimized = await optimizeToWebp(buffer);
        const filename = `${id}.webp`;
        urls.push(await storeFile(filename, optimized, "image/webp"));
      } catch {
        const ext = path.extname(file.name) || ".bin";
        const filename = `${id}${ext}`;
        urls.push(await storeFile(filename, buffer, file.type || "application/octet-stream"));
      }
    }

    return NextResponse.json({ urls }, { status: 201 });
  } catch (error) {
    console.error("upload error", error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : "Error al subir imágenes" },
      { status: 500 }
    );
  }
}
