import {
  applySegmentationMask,
  removeBackground,
  segmentForeground,
} from "@imgly/background-removal-node";
import fs from "fs/promises";
import path from "path";
import sharp from "sharp";
import type { AIAssetType } from "@/modules/ai-studio/domain/entities";
import { fetchImageBuffer } from "./storage.service";

export class GenerativeStudioError extends Error {
  readonly code: "MISSING_MODEL" | "NO_IMAGE" | "PROVIDER";

  constructor(code: GenerativeStudioError["code"], message: string) {
    super(message);
    this.code = code;
    this.name = "GenerativeStudioError";
  }
}

export type SealTone = "light" | "dark";

const STUDIO_LIGHT = { r: 244, g: 243, b: 239 };
const STUDIO_DARK = { r: 14, g: 14, b: 14 };

const SEAL_LIGHT = path.join(process.cwd(), "public", "brand", "sello-light.png");
const SEAL_DARK = path.join(process.cwd(), "public", "brand", "sello-dark.png");

type Rgb = { r: number; g: number; b: number };

function asPngBlob(buffer: Buffer) {
  return new Blob([new Uint8Array(buffer)], { type: "image/png" });
}

async function blobToBuffer(blob: Blob): Promise<Buffer> {
  return Buffer.from(await blob.arrayBuffer());
}

/** Sample average background color from the four corners of the source photo. */
async function sampleCornerBackground(source: Buffer): Promise<Rgb> {
  const meta = await sharp(source).metadata();
  const w = meta.width ?? 100;
  const h = meta.height ?? 100;
  const patch = Math.max(8, Math.round(Math.min(w, h) * 0.04));
  const corners = [
    { left: 0, top: 0 },
    { left: Math.max(0, w - patch), top: 0 },
    { left: 0, top: Math.max(0, h - patch) },
    { left: Math.max(0, w - patch), top: Math.max(0, h - patch) },
  ];

  let r = 0;
  let g = 0;
  let b = 0;
  let n = 0;
  for (const c of corners) {
    const { data } = await sharp(source)
      .extract({ left: c.left, top: c.top, width: patch, height: patch })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    for (let i = 0; i < data.length; i += 4) {
      r += data[i] ?? 0;
      g += data[i + 1] ?? 0;
      b += data[i + 2] ?? 0;
      n += 1;
    }
  }
  if (!n) return { r: 180, g: 180, b: 180 };
  return { r: r / n, g: g / n, b: b / n };
}

function colorDist(a: Rgb, b: Rgb) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
}

/**
 * Aggressive matte polish:
 * - kill residual bg by color proximity + low alpha
 * - erode 1px fringe of semi-transparent pixels
 * - color-decontaminate edge RGB
 * - harden alpha with smooth thresholds
 */
async function polishCutout(cutout: Buffer, bg: Rgb): Promise<Buffer> {
  const { data, info } = await sharp(cutout)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const w = info.width;
  const h = info.height;
  const rgba = Buffer.from(data);
  const alpha = new Uint8Array(w * h);

  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    let a = (rgba[o + 3] ?? 0) / 255;
    const rgb = { r: rgba[o] ?? 0, g: rgba[o + 1] ?? 0, b: rgba[o + 2] ?? 0 };
    const dist = colorDist(rgb, bg);

    // Residual background / soft halo → drop
    if (a < 0.12 || (dist < 42 && a < 0.88) || (dist < 28 && a < 0.97)) {
      a = 0;
    } else if (a > 0.9 && dist > 55) {
      a = 1;
    }

    if (a > 0.02 && a < 0.98) {
      // Color decontamination against sampled background
      const inv = 1 - a;
      rgba[o] = Math.max(0, Math.min(255, Math.round((rgb.r - inv * bg.r) / a)));
      rgba[o + 1] = Math.max(0, Math.min(255, Math.round((rgb.g - inv * bg.g) / a)));
      rgba[o + 2] = Math.max(0, Math.min(255, Math.round((rgb.b - inv * bg.b) / a)));
    }

    // Smoothstep harden
    const t = Math.max(0, Math.min(1, (a - 0.2) / 0.55));
    const smooth = t * t * (3 - 2 * t);
    alpha[i] = Math.round(smooth * 255);
  }

  // 1px morphological erosion on mid/high alpha to shave leftover fringe
  const eroded = new Uint8Array(alpha);
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if (alpha[i]! < 40) {
        eroded[i] = 0;
        continue;
      }
      let minA = alpha[i]!;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const v = alpha[(y + dy) * w + (x + dx)] ?? 0;
          if (v < minA) minA = v;
        }
      }
      // Only erode the soft rim, keep solid garment
      eroded[i] = alpha[i]! > 220 ? alpha[i]! : minA;
    }
  }

  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    let a = eroded[i] ?? 0;
    if (a < 20) a = 0;
    else if (a > 235) a = 255;
    rgba[o + 3] = a;
    if (a === 0) {
      rgba[o] = 0;
      rgba[o + 1] = 0;
      rgba[o + 2] = 0;
    }
  }

  const hardened = await sharp(rgba, {
    raw: { width: w, height: h, channels: 4 },
  })
    .png()
    .toBuffer();

  // Tiny alpha blur for natural silhouette (not soft enough to bring bg back)
  const softAlpha = await sharp(hardened).extractChannel(3).blur(0.45).toBuffer();
  return sharp(hardened).removeAlpha().joinChannel(softAlpha).png().toBuffer();
}

async function runOnnxCutout(original: Buffer, model: "medium" | "large"): Promise<Buffer> {
  // Segment on contrast-enhanced copy, apply mask to ORIGINAL colors
  // (critical for black garments on dark/busy backgrounds).
  const enhanced = await sharp(original)
    .normalize()
    .modulate({ brightness: 1.22, saturation: 1.12 })
    .linear(1.28, -(128 * 0.28))
    .sharpen({ sigma: 0.9 })
    .png()
    .toBuffer();

  const originalBlob = asPngBlob(original);
  const enhancedBlob = asPngBlob(enhanced);

  const tryModel = async (m: "medium" | "large") => {
    try {
      const maskBlob = await segmentForeground(enhancedBlob, {
        model: m,
        output: { format: "image/png", quality: 1 },
      });
      const refinedMask = await polishMaskOnly(await blobToBuffer(maskBlob));
      const applied = await applySegmentationMask(originalBlob, asPngBlob(refinedMask), {
        model: m,
        output: { format: "image/png", quality: 1 },
      });
      return blobToBuffer(applied);
    } catch {
      const blob = await removeBackground(enhancedBlob, {
        model: m,
        output: { format: "image/png", quality: 1 },
      });
      // removeBackground returns enhanced colors — re-apply alpha onto original
      const cutEnhanced = await blobToBuffer(blob);
      return transferAlphaToOriginal(original, cutEnhanced);
    }
  };

  try {
    return await tryModel(model);
  } catch (error) {
    if (model === "large") return tryModel("medium");
    throw error;
  }
}

async function transferAlphaToOriginal(original: Buffer, cutWithAlpha: Buffer): Promise<Buffer> {
  const base = await sharp(original).ensureAlpha().resize({
    width: (await sharp(cutWithAlpha).metadata()).width,
    height: (await sharp(cutWithAlpha).metadata()).height,
    fit: "fill",
  }).raw().toBuffer({ resolveWithObject: true });
  const alphaImg = await sharp(cutWithAlpha).ensureAlpha().extractChannel(3).raw().toBuffer();
  const out = Buffer.from(base.data);
  for (let i = 0; i < alphaImg.length; i++) {
    out[i * 4 + 3] = alphaImg[i] ?? 0;
  }
  return sharp(out, {
    raw: { width: base.info.width, height: base.info.height, channels: 4 },
  })
    .png()
    .toBuffer();
}

/** Polish a grayscale/RGBA mask before applying to RGB. */
async function polishMaskOnly(mask: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(mask)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const out = Buffer.from(data);

  for (let i = 0; i < w * h; i++) {
    const o = i * 4;
    // mask may store alpha in R or A
    let a = Math.max(out[o] ?? 0, out[o + 3] ?? 0);
    if (a < 28) a = 0;
    else if (a > 220) a = 255;
    out[o] = a;
    out[o + 1] = a;
    out[o + 2] = a;
    out[o + 3] = 255;
  }

  // Erode soft edges once
  const alpha = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) alpha[i] = out[i * 4] ?? 0;
  for (let y = 1; y < h - 1; y++) {
    for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      if ((alpha[i] ?? 0) < 40) continue;
      let minA = alpha[i]!;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          minA = Math.min(minA, alpha[(y + dy) * w + (x + dx)] ?? 0);
        }
      }
      if ((alpha[i] ?? 0) < 230) {
        out[i * 4] = minA;
        out[i * 4 + 1] = minA;
        out[i * 4 + 2] = minA;
      }
    }
  }

  return sharp(out, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
}

async function contentBBox(cutout: Buffer) {
  const { data, info } = await sharp(cutout)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  let minX = w;
  let minY = h;
  let maxX = 0;
  let maxY = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = data[(y * w + x) * 4 + 3] ?? 0;
      if (a < 40) continue;
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (maxX < minX || maxY < minY) {
    return { left: 0, top: 0, width: w, height: h };
  }
  const padX = Math.round((maxX - minX + 1) * 0.06);
  const padY = Math.round((maxY - minY + 1) * 0.06);
  const left = Math.max(0, minX - padX);
  const top = Math.max(0, minY - padY);
  const right = Math.min(w, maxX + 1 + padX);
  const bottom = Math.min(h, maxY + 1 + padY);
  return { left, top, width: right - left, height: bottom - top };
}

/**
 * High-quality local cutout: large ONNX + dual pass + color decontamination.
 * Still free / offline after model download — no paid gateway.
 */
async function removeBackgroundLocal(source: Buffer): Promise<Buffer> {
  try {
    const bg = await sampleCornerBackground(source);

    // Pass 1 — full frame, large model (mask on enhanced, colors from original)
    const pass1 = await runOnnxCutout(source, "large");
    let polished = await polishCutout(pass1, bg);

    // Pass 2 — tight crop re-matting for stubborn residual bg
    try {
      const box = await contentBBox(polished);
      if (box.width > 40 && box.height > 40) {
        const crop = await sharp(source)
          .extract(box)
          .resize({
            width: Math.min(1600, box.width * 2),
            height: Math.min(1600, box.height * 2),
            fit: "inside",
            withoutEnlargement: false,
          })
          .png()
          .toBuffer();

        const pass2 = await runOnnxCutout(crop, "large");
        const bg2 = await sampleCornerBackground(crop);
        const polished2 = await polishCutout(pass2, bg2);

        const fitted = await sharp(polished2)
          .resize(box.width, box.height, { fit: "fill" })
          .png()
          .toBuffer();

        const baseMeta = await sharp(source).metadata();
        const canvasW = baseMeta.width ?? box.width;
        const canvasH = baseMeta.height ?? box.height;

        polished = await sharp({
          create: {
            width: canvasW,
            height: canvasH,
            channels: 4,
            background: { r: 0, g: 0, b: 0, alpha: 0 },
          },
        })
          .composite([{ input: fitted, left: box.left, top: box.top }])
          .png()
          .toBuffer();

        polished = await polishCutout(polished, bg);
      }
    } catch {
      // Keep pass-1 result if pass-2 fails
    }

    polished = await keepLargestOpaqueComponents(polished);

    if (!polished.length) {
      throw new GenerativeStudioError("NO_IMAGE", "El modelo no devolvió imagen");
    }
    return polished;
  } catch (error) {
    if (error instanceof GenerativeStudioError) throw error;
    const message = error instanceof Error ? error.message : "Error al eliminar fondo";
    throw new GenerativeStudioError(
      "PROVIDER",
      `Recorte local falló (${message}). Reintenta; la primera vez descarga el modelo ONNX gratis.`
    );
  }
}

/** Drop small floating artifacts; keep the main garment blob(s). */
async function keepLargestOpaqueComponents(cutout: Buffer): Promise<Buffer> {
  const { data, info } = await sharp(cutout)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const w = info.width;
  const h = info.height;
  const n = w * h;
  const visited = new Uint8Array(n);
  const rgba = Buffer.from(data);
  const components: number[][] = [];

  const isFg = (i: number) => (rgba[i * 4 + 3] ?? 0) >= 90;

  for (let start = 0; start < n; start++) {
    if (visited[start] || !isFg(start)) continue;
    const stack = [start];
    visited[start] = 1;
    const cells: number[] = [];
    while (stack.length) {
      const i = stack.pop()!;
      cells.push(i);
      const x = i % w;
      const y = (i / w) | 0;
      const neighbors = [
        x > 0 ? i - 1 : -1,
        x < w - 1 ? i + 1 : -1,
        y > 0 ? i - w : -1,
        y < h - 1 ? i + w : -1,
      ];
      for (const nb of neighbors) {
        if (nb < 0 || visited[nb] || !isFg(nb)) continue;
        visited[nb] = 1;
        stack.push(nb);
      }
    }
    components.push(cells);
  }

  if (!components.length) return cutout;
  components.sort((a, b) => b.length - a.length);
  const keepThreshold = Math.max(400, Math.floor(n * 0.008));
  const keep = new Set<number>();
  for (const comp of components) {
    if (comp === components[0] || comp.length >= keepThreshold) {
      for (const i of comp) keep.add(i);
    }
  }

  for (let i = 0; i < n; i++) {
    if (keep.has(i)) continue;
    const o = i * 4;
    rgba[o] = 0;
    rgba[o + 1] = 0;
    rgba[o + 2] = 0;
    rgba[o + 3] = 0;
  }

  return sharp(rgba, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toBuffer();
}

export type CutoutAnalysis = {
  isDarkGarment: boolean;
  meanLuma: number;
  opaqueRatio: number;
};

/** Analyze opaque pixels to decide studio backdrop strategy. */
export async function analyzeCutout(cutout: Buffer): Promise<CutoutAnalysis> {
  const { data, info } = await sharp(cutout)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const n = info.width * info.height;
  let lumaSum = 0;
  let opaque = 0;
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const a = data[o + 3] ?? 0;
    if (a < 140) continue;
    const r = data[o] ?? 0;
    const g = data[o + 1] ?? 0;
    const b = data[o + 2] ?? 0;
    lumaSum += 0.2126 * r + 0.7152 * g + 0.0722 * b;
    opaque += 1;
  }
  const meanLuma = opaque ? lumaSum / opaque : 128;
  return {
    isDarkGarment: meanLuma < 70,
    meanLuma,
    opaqueRatio: opaque / Math.max(1, n),
  };
}

/**
 * Soft light rim so black garments keep a readable silhouette on dark or transparent canvases.
 */
export async function withSilhouetteRim(cutout: Buffer): Promise<Buffer> {
  try {
    const meta = await sharp(cutout).metadata();
    const width = meta.width ?? 800;
    const height = meta.height ?? 800;

    const expandedAlpha = await sharp(cutout)
      .ensureAlpha()
      .extractChannel(3)
      .blur(2.2)
      .linear(2.4, -30)
      .toBuffer();

    const rimRaw = Buffer.alloc(width * height * 4);
    for (let i = 0; i < width * height; i++) {
      const a = expandedAlpha[i] ?? 0;
      const o = i * 4;
      rimRaw[o] = 228;
      rimRaw[o + 1] = 228;
      rimRaw[o + 2] = 232;
      rimRaw[o + 3] = a;
    }

    const rim = await sharp(rimRaw, {
      raw: { width, height, channels: 4 },
    })
      .png()
      .toBuffer();

    return sharp(rim)
      .composite([{ input: cutout, gravity: "centre" }])
      .png()
      .toBuffer();
  } catch {
    return cutout;
  }
}

/** Trim transparent margins and keep balanced padding for catalog framing. */
async function trimAndPadCutout(cutout: Buffer, padRatio = 0.12): Promise<Buffer> {
  const trimmed = await sharp(cutout).trim({ threshold: 8 }).png().toBuffer();
  const meta = await sharp(trimmed).metadata();
  const w = meta.width ?? 800;
  const h = meta.height ?? 800;
  const pad = Math.max(40, Math.round(Math.max(w, h) * padRatio));
  const side = Math.max(w, h) + pad * 2;

  return sharp({
    create: {
      width: side,
      height: side,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: trimmed, gravity: "centre" }])
    .png()
    .toBuffer();
}

async function studioBackdrop(size: number, tone: SealTone | "charcoal"): Promise<Buffer> {
  const svg =
    tone === "dark"
      ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
          <defs>
            <radialGradient id="g" cx="50%" cy="40%" r="72%">
              <stop offset="0%" stop-color="#3A3A3A"/>
              <stop offset="55%" stop-color="#1C1C1C"/>
              <stop offset="100%" stop-color="#0E0E0E"/>
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>`
      : tone === "charcoal"
        ? `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
          <defs>
            <radialGradient id="g" cx="50%" cy="38%" r="75%">
              <stop offset="0%" stop-color="#5A5A5A"/>
              <stop offset="55%" stop-color="#3D3D3D"/>
              <stop offset="100%" stop-color="#2A2A2A"/>
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>`
      : `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}">
          <defs>
            <radialGradient id="g" cx="50%" cy="38%" r="75%">
              <stop offset="0%" stop-color="#FBFAF7"/>
              <stop offset="55%" stop-color="#F1EEE7"/>
              <stop offset="100%" stop-color="#E4E0D6"/>
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#g)"/>
        </svg>`;

  return sharp(Buffer.from(svg)).png().toBuffer();
}

/** Soft contact shadow under the garment for studio catalog look. */
export async function withContactShadowSafe(cutoutPng: Buffer): Promise<Buffer> {
  try {
    return await withContactShadow(cutoutPng);
  } catch {
    return cutoutPng;
  }
}

async function withContactShadow(cutoutPng: Buffer): Promise<Buffer> {
  const meta = await sharp(cutoutPng).metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 1200;
  const sw = Math.round(width * 0.62);
  const sh = Math.round(height * 0.12);
  const shadowSvg = Buffer.from(
    `<svg width="${sw}" height="${sh}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${sw / 2}" cy="${sh / 2}" rx="${sw / 2}" ry="${sh / 2}" fill="#000" opacity="0.32"/>
    </svg>`
  );
  const shadow = await sharp(shadowSvg).blur(14).png().toBuffer();

  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([
      {
        input: shadow,
        left: Math.round((width - sw) / 2),
        top: Math.round(height - sh - height * 0.08),
      },
      { input: cutoutPng, gravity: "centre" },
    ])
    .png()
    .toBuffer();
}

export async function remodelProductPhoto(
  sourceUrl: string,
  type: AIAssetType = "FLATLAY"
): Promise<Buffer> {
  const source = await fetchImageBuffer(sourceUrl);
  const prepared = await sharp(source)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  const rawCutout = await removeBackgroundLocal(prepared);
  const cutout = await trimAndPadCutout(rawCutout);
  const withShadow = await withContactShadowSafe(cutout);

  const tone: SealTone =
    type === "BLACK_BACKGROUND" || type === "STREET" ? "dark" : "light";

  return placeOnBackground(withShadow, tone === "dark" ? STUDIO_DARK : STUDIO_LIGHT, tone);
}

/** Transparent cutout from source photo (local ONNX HQ). */
export async function cutoutFromSource(sourceUrl: string): Promise<Buffer> {
  const source = await fetchImageBuffer(sourceUrl);
  const prepared = await sharp(source)
    .rotate()
    .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
    .png()
    .toBuffer();

  const rawCutout = await removeBackgroundLocal(prepared);
  return trimAndPadCutout(rawCutout);
}

async function loadOfficialSeal(tone: SealTone, sealSize: number): Promise<Buffer> {
  const file = tone === "dark" ? SEAL_DARK : SEAL_LIGHT;
  try {
    await fs.access(file);
  } catch {
    throw new GenerativeStudioError(
      "MISSING_MODEL",
      `No se encontró el sello oficial (${path.basename(file)}).`
    );
  }

  return sharp(file)
    .resize(sealSize, sealSize, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer();
}

/** Overlay official Capital Gang seal (same asset as login) with contrast plate. */
export async function stampBrandSeal(
  image: Buffer,
  tone: SealTone = "light"
): Promise<Buffer> {
  const meta = await sharp(image).metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 1200;
  const sealSize = Math.max(200, Math.round(Math.min(width, height) * 0.24));
  const margin = Math.max(28, Math.round(Math.min(width, height) * 0.04));

  const seal = await loadOfficialSeal(tone, sealSize);
  const plateSize = Math.round(sealSize * 1.18);
  const plateFill =
    tone === "dark" ? "rgba(8,8,8,0.78)" : "rgba(255,255,255,0.82)";
  const plate = await sharp(
    Buffer.from(
      `<svg xmlns="http://www.w3.org/2000/svg" width="${plateSize}" height="${plateSize}">
        <circle cx="${plateSize / 2}" cy="${plateSize / 2}" r="${plateSize / 2 - 1}" fill="${plateFill}"/>
      </svg>`
    )
  )
    .png()
    .toBuffer();

  const left = width - sealSize - margin;
  const top = height - sealSize - margin;
  const plateLeft = Math.max(0, left - Math.round((plateSize - sealSize) / 2));
  const plateTop = Math.max(0, top - Math.round((plateSize - sealSize) / 2));

  return sharp(image)
    .ensureAlpha()
    .composite([
      { input: plate, left: plateLeft, top: plateTop },
      { input: seal, left, top },
    ])
    .png()
    .toBuffer();
}

export async function cutoutCleanStudioBackground(image: Buffer): Promise<Buffer> {
  const meta = await sharp(image).metadata();
  if (meta.hasAlpha) {
    return sharp(image).png().toBuffer();
  }
  return sharp(image).ensureAlpha().png().toBuffer();
}

export async function placeOnBackground(
  cutoutPng: Buffer,
  color: { r: number; g: number; b: number },
  tone?: SealTone | "charcoal"
): Promise<Buffer> {
  const meta = await sharp(cutoutPng).metadata();
  const width = meta.width ?? 1200;
  const height = meta.height ?? 1200;
  const side = Math.max(width, height);

  const resolvedTone: SealTone | "charcoal" =
    tone ?? (color.r + color.g + color.b < 120 ? "dark" : "light");

  const canvas = await studioBackdrop(side, resolvedTone);

  return sharp(canvas)
    .composite([{ input: cutoutPng, gravity: "centre" }])
    .jpeg({ quality: 93 })
    .toBuffer();
}
