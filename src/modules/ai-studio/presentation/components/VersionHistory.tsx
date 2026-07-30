"use client";

import Image from "next/image";
import { Copy, Download, RotateCcw, Trash2 } from "lucide-react";
import { AI_ASSET_TYPE_LABELS, formatBytes } from "../../domain/entities";
import type { AIVersionDTO } from "../types";
import { cn } from "@/shared/lib/cn";

export function VersionCard({
  version,
  onRestore,
  onDuplicate,
  onDelete,
  onPreview,
}: {
  version: AIVersionDTO;
  onRestore: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-xl border border-line bg-surface p-3",
        version.isCurrent && "border-brand/40"
      )}
    >
      <button
        type="button"
        onClick={() => onPreview(version.id)}
        className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-elevated"
      >
        <Image src={version.storagePath} alt="" fill sizes="64px" className="object-cover" />
      </button>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-fg">
          v{version.versionNumber} · {AI_ASSET_TYPE_LABELS[version.processingType]}
        </p>
        <p className="mt-0.5 text-[11px] text-muted">
          {formatBytes(version.size)}
          {version.width && version.height ? ` · ${version.width}×${version.height}` : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-1">
          <button
            type="button"
            onClick={() => onRestore(version.id)}
            disabled={version.isCurrent}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted hover:bg-elevated hover:text-fg disabled:opacity-40"
          >
            <RotateCcw size={12} /> Restaurar
          </button>
          <button
            type="button"
            onClick={() => onDuplicate(version.id)}
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted hover:bg-elevated hover:text-fg"
          >
            <Copy size={12} /> Duplicar
          </button>
          <a
            href={version.storagePath}
            download
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted hover:bg-elevated hover:text-fg"
          >
            <Download size={12} /> Descargar
          </a>
          {!version.isOriginal && (
            <button
              type="button"
              onClick={() => onDelete(version.id)}
              className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] text-muted hover:bg-elevated hover:text-danger"
            >
              <Trash2 size={12} /> Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export function VersionHistory({
  versions,
  onRestore,
  onDuplicate,
  onDelete,
  onPreview,
}: {
  versions: AIVersionDTO[];
  onRestore: (id: string) => void;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  onPreview: (id: string) => void;
}) {
  const ordered = [...versions].sort((a, b) => b.versionNumber - a.versionNumber);

  return (
    <div className="space-y-2">
      {ordered.map((version) => (
        <VersionCard
          key={version.id}
          version={version}
          onRestore={onRestore}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          onPreview={onPreview}
        />
      ))}
    </div>
  );
}
