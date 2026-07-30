import { createHash } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { put } from "@vercel/blob";
import { nanoid } from "nanoid";

export async function storeAIStudioFile(
  data: Buffer,
  contentType: string,
  extension: string
): Promise<{ url: string; size: number; checksum: string }> {
  const filename = `ai-studio/${nanoid(14)}.${extension.replace(/^\./, "")}`;
  const checksum = createHash("sha256").update(data).digest("hex");

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, data, {
      access: "public",
      contentType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url, size: data.byteLength, checksum };
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads", "ai-studio");
  await mkdir(uploadDir, { recursive: true });
  const localName = path.basename(filename);
  await writeFile(path.join(uploadDir, localName), data);
  return { url: `/uploads/ai-studio/${localName}`, size: data.byteLength, checksum };
}

export async function fetchImageBuffer(url: string): Promise<Buffer> {
  if (url.startsWith("/")) {
    const { readFile } = await import("fs/promises");
    const filePath = path.join(process.cwd(), "public", url.replace(/^\//, ""));
    return readFile(filePath);
  }

  const res = await fetch(url);
  if (!res.ok) throw new Error(`No se pudo leer la imagen: ${url}`);
  return Buffer.from(await res.arrayBuffer());
}
