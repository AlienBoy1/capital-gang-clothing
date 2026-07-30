import sharp from "sharp";
import type { AIAssetType } from "@/modules/ai-studio/domain/entities";
import {
  analyzeCutout,
  cutoutFromSource,
  GenerativeStudioError,
  placeOnBackground,
  stampBrandSeal,
  withContactShadowSafe,
  withSilhouetteRim,
  type CutoutAnalysis,
  type SealTone,
} from "./generative-studio.service";
import { fetchImageBuffer, storeAIStudioFile } from "./storage.service";

export interface ProcessedVariant {
  processingType: AIAssetType;
  storagePath: string;
  mime: string;
  width: number | null;
  height: number | null;
  size: number;
  checksum: string;
  notes: string;
}

export interface CatalogMaster {
  sourceUrl: string;
  remodeled: Buffer;
  cutout: Buffer;
  analysis: CutoutAnalysis;
}

async function meta(buffer: Buffer) {
  const info = await sharp(buffer).metadata();
  return { width: info.width ?? null, height: info.height ?? null };
}

async function toVariant(
  buffer: Buffer,
  processingType: AIAssetType,
  mime: string,
  extension: string,
  notes: string
): Promise<ProcessedVariant> {
  const stored = await storeAIStudioFile(buffer, mime, extension);
  const m = await meta(buffer);
  return {
    processingType,
    storagePath: stored.url,
    mime,
    ...m,
    size: stored.size,
    checksum: stored.checksum,
    notes,
  };
}

async function stampAndEncode(
  image: Buffer,
  tone: SealTone,
  format: "jpeg" | "png" | "webp",
  quality = 92
): Promise<Buffer> {
  const stamped = await stampBrandSeal(image, tone);
  if (format === "png") return sharp(stamped).png().toBuffer();
  if (format === "webp") return sharp(stamped).webp({ quality }).toBuffer();
  return sharp(stamped).jpeg({ quality }).toBuffer();
}

async function prepareSubject(cutout: Buffer, analysis: CutoutAnalysis, forDarkBg: boolean) {
  let subject = cutout;
  if (analysis.isDarkGarment && forDarkBg) {
    subject = await withSilhouetteRim(cutout);
  }
  return withContactShadowSafe(subject);
}

/** Local ONNX cutout → studio variants + official brand seal. 100% free. */
export async function createCatalogMaster(sourceUrl: string): Promise<CatalogMaster> {
  const cutout = await cutoutFromSource(sourceUrl);
  const analysis = await analyzeCutout(cutout);
  const subject = await prepareSubject(cutout, analysis, false);
  const remodeled = await placeOnBackground(subject, { r: 244, g: 243, b: 239 }, "light");
  return { sourceUrl, remodeled, cutout, analysis };
}

export async function processVariantFromMaster(
  master: CatalogMaster,
  targetType: AIAssetType
): Promise<ProcessedVariant> {
  const { cutout, analysis } = master;
  const dark = analysis.isDarkGarment;

  switch (targetType) {
    case "BACKGROUND_REMOVED": {
      // Transparent PNG; rim on dark garments so silhouette reads on checkerboard
      const subject = dark ? await withSilhouetteRim(cutout) : cutout;
      const withShadow = await withContactShadowSafe(subject);
      const buffer = await stampAndEncode(withShadow, "dark", "png");
      return toVariant(
        buffer,
        targetType,
        "image/png",
        "png",
        dark
          ? "Fondo eliminado + rim para prenda oscura + sello oficial"
          : "Fondo eliminado (ONNX) + sello oficial Capital Gang"
      );
    }
    case "WHITE_BACKGROUND":
    case "FLATLAY": {
      // Always light studio for catalog — never hide black garments
      const subject = await prepareSubject(cutout, analysis, false);
      const onWhite = await placeOnBackground(subject, { r: 244, g: 243, b: 239 }, "light");
      const buffer = await stampAndEncode(onWhite, "light", "jpeg", 93);
      return toVariant(
        buffer,
        targetType,
        "image/jpeg",
        "jpg",
        "Catálogo fondo claro + sello oficial Capital Gang"
      );
    }
    case "BLACK_BACKGROUND": {
      // Dark garments → charcoal (not pure black) + rim so product stays visible
      const subject = await prepareSubject(cutout, analysis, true);
      const onDark = await placeOnBackground(
        subject,
        dark ? { r: 42, g: 42, b: 42 } : { r: 18, g: 18, b: 18 },
        dark ? "charcoal" : "dark"
      );
      const buffer = await stampAndEncode(onDark, "dark", "jpeg", 93);
      return toVariant(
        buffer,
        targetType,
        "image/jpeg",
        "jpg",
        dark
          ? "Editorial carbón + rim (prenda oscura) + sello oficial"
          : "Catálogo editorial fondo oscuro + sello oficial Capital Gang"
      );
    }
    case "PNG": {
      const subject = dark ? await withSilhouetteRim(cutout) : cutout;
      const buffer = await stampAndEncode(subject, "dark", "png");
      return toVariant(buffer, targetType, "image/png", "png", "Export PNG + sello oficial");
    }
    case "WEBP": {
      const subject = dark ? await withSilhouetteRim(cutout) : cutout;
      const buffer = await stampAndEncode(subject, "dark", "webp", 90);
      return toVariant(buffer, targetType, "image/webp", "webp", "Export WEBP + sello oficial");
    }
    case "JPG": {
      const subject = await prepareSubject(cutout, analysis, false);
      const onWhite = await placeOnBackground(subject, { r: 255, g: 255, b: 255 }, "light");
      const buffer = await stampAndEncode(onWhite, "light", "jpeg", 92);
      return toVariant(buffer, targetType, "image/jpeg", "jpg", "Export JPG + sello oficial");
    }
    case "THUMBNAIL": {
      // Thumbnails always light — black-on-black thumbs are unusable
      const subject = await prepareSubject(cutout, analysis, false);
      const onWhite = await placeOnBackground(subject, { r: 244, g: 243, b: 239 }, "light");
      const stamped = await stampBrandSeal(onWhite, "light");
      const buffer = await sharp(stamped)
        .resize({ width: 480, height: 480, fit: "contain", background: { r: 244, g: 243, b: 239 } })
        .webp({ quality: 84 })
        .toBuffer();
      return toVariant(buffer, targetType, "image/webp", "webp", "Miniatura fondo claro + sello oficial");
    }
    case "MOCKUP":
    case "STREET":
    case "DETAIL":
    case "TRYON_MAN":
    case "TRYON_WOMAN": {
      const subject = await prepareSubject(cutout, analysis, false);
      const onStudio = await placeOnBackground(subject, { r: 236, g: 234, b: 228 }, "light");
      const stamped = await stampBrandSeal(onStudio, "light");
      const buffer = await sharp(stamped)
        .modulate({ brightness: 1.015, saturation: 1.05 })
        .sharpen({ sigma: 0.55 })
        .webp({ quality: 92 })
        .toBuffer();
      return toVariant(
        buffer,
        targetType,
        "image/webp",
        "webp",
        "Mockup de catálogo + sello oficial Capital Gang"
      );
    }
    default: {
      const buffer = await stampAndEncode(master.remodeled, "light", "webp", 90);
      return toVariant(
        buffer,
        targetType,
        "image/webp",
        "webp",
        "Derivado de catálogo + sello oficial Capital Gang"
      );
    }
  }
}

/** @deprecated Prefer createCatalogMaster + processVariantFromMaster */
export async function processVariant(
  sourceUrl: string,
  targetType: AIAssetType
): Promise<ProcessedVariant> {
  const master = await createCatalogMaster(sourceUrl);
  return processVariantFromMaster(master, targetType);
}

export { GenerativeStudioError, fetchImageBuffer };
