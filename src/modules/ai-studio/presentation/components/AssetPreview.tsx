"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { AI_ASSET_TYPE_LABELS, formatBytes } from "../../domain/entities";
import type { AIVersionDTO } from "../types";

export function AssetPreview({
  version,
  onClose,
}: {
  version: AIVersionDTO | null;
  onClose: () => void;
}) {
  if (!version) return null;

  return (
    <div className="fixed inset-0 z-[90] flex items-end justify-center bg-black/80 p-0 sm:items-center sm:p-6">
      <button type="button" className="absolute inset-0" aria-label="Cerrar" onClick={onClose} />
      <div className="relative z-10 flex max-h-[95vh] w-full max-w-4xl flex-col overflow-hidden rounded-t-3xl border border-line bg-canvas sm:rounded-3xl">
        <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
          <div>
            <p className="text-sm font-semibold text-fg">
              v{version.versionNumber} · {AI_ASSET_TYPE_LABELS[version.processingType]}
            </p>
            <p className="text-xs text-muted">
              {version.width && version.height ? `${version.width}×${version.height}` : "—"} ·{" "}
              {formatBytes(version.size)} · {version.mime}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-line bg-elevated"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>
        <div
          className="relative min-h-[50vh] flex-1 bg-elevated"
          style={{
            backgroundImage:
              "linear-gradient(45deg,#cfcfcf 25%,transparent 25%),linear-gradient(-45deg,#cfcfcf 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#cfcfcf 75%),linear-gradient(-45deg,transparent 75%,#cfcfcf 75%)",
            backgroundSize: "18px 18px",
            backgroundPosition: "0 0,0 9px,9px -9px,-9px 0",
          }}
        >
          <Image src={version.storagePath} alt="" fill sizes="100vw" className="object-contain" />
        </div>
      </div>
    </div>
  );
}
