export type AIProjectStatus = "DRAFT" | "PROCESSING" | "READY" | "PUBLISHED" | "ARCHIVED";

export type AIAssetStatus =
  | "DRAFT"
  | "PROCESSING"
  | "READY"
  | "PUBLISHED"
  | "ARCHIVED"
  | "ERROR";

export type AIAssetType =
  | "ORIGINAL"
  | "BACKGROUND_REMOVED"
  | "WHITE_BACKGROUND"
  | "BLACK_BACKGROUND"
  | "PNG"
  | "WEBP"
  | "JPG"
  | "MOCKUP"
  | "STREET"
  | "FLATLAY"
  | "TRYON_MAN"
  | "TRYON_WOMAN"
  | "DETAIL"
  | "THUMBNAIL"
  | "PREVIEW_3D"
  | "GLB";

export type AIVersionJobStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "ERROR";

export const AI_ASSET_TYPE_LABELS: Record<AIAssetType, string> = {
  ORIGINAL: "Original",
  BACKGROUND_REMOVED: "Fondo eliminado",
  WHITE_BACKGROUND: "Fondo blanco",
  BLACK_BACKGROUND: "Fondo oscuro",
  PNG: "PNG",
  WEBP: "WEBP",
  JPG: "JPG",
  MOCKUP: "Mockup",
  STREET: "Street",
  FLATLAY: "Flatlay",
  TRYON_MAN: "Try-On Hombre",
  TRYON_WOMAN: "Try-On Mujer",
  DETAIL: "Detalle",
  THUMBNAIL: "Miniatura",
  PREVIEW_3D: "Preview 3D",
  GLB: "GLB",
};

export const AI_ASSET_STATUS_LABELS: Record<AIAssetStatus, string> = {
  DRAFT: "Borrador",
  PROCESSING: "Procesando",
  READY: "Listo",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
  ERROR: "Error",
};

export const AI_PROJECT_STATUS_LABELS: Record<AIProjectStatus, string> = {
  DRAFT: "Borrador",
  PROCESSING: "Procesando",
  READY: "Listo",
  PUBLISHED: "Publicado",
  ARCHIVED: "Archivado",
};

/** Default pipeline: local ONNX cutout → catalog variants + brand seal */
export const DEFAULT_PROCESS_PIPELINE: AIAssetType[] = [
  "FLATLAY",
  "BACKGROUND_REMOVED",
  "WHITE_BACKGROUND",
  "BLACK_BACKGROUND",
  "PNG",
  "WEBP",
  "JPG",
  "THUMBNAIL",
  "MOCKUP",
];

export function canPublishAssetStatus(status: AIAssetStatus): boolean {
  return status === "READY" || status === "PUBLISHED";
}

export function formatBytes(bytes: number | null | undefined): string {
  if (bytes == null || Number.isNaN(bytes)) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
