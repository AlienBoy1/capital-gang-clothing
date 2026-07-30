"use client";

import {
  Download,
  GitCompare,
  Heart,
  History,
  Trash2,
  Wand2,
} from "lucide-react";
import { PublishCatalogButton } from "./PublishCatalogButton";

export function AssetActionBar({
  count,
  publishing,
  processing,
  onFavorite,
  onDownload,
  onProcess,
  onDelete,
  onCompare,
  onHistory,
  onPublish,
}: {
  count: number;
  publishing?: boolean;
  processing?: boolean;
  onFavorite: () => void;
  onDownload: () => void;
  onProcess: () => void;
  onDelete: () => void;
  onCompare: () => void;
  onHistory: () => void;
  onPublish: () => void;
}) {
  if (count === 0) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-[70] border-t border-line bg-canvas/95 p-3 backdrop-blur-xl sm:p-4">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-center text-sm font-medium text-fg sm:text-left">
          {count} seleccionado{count === 1 ? "" : "s"}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-2">
          <IconAction label="Favoritos" onClick={onFavorite}>
            <Heart size={16} />
          </IconAction>
          <IconAction label="Descargar" onClick={onDownload}>
            <Download size={16} />
          </IconAction>
          <IconAction label="Regenerar" onClick={onProcess} busy={processing}>
            <Wand2 size={16} />
          </IconAction>
          <IconAction label="Comparar" onClick={onCompare}>
            <GitCompare size={16} />
          </IconAction>
          <IconAction label="Historial" onClick={onHistory}>
            <History size={16} />
          </IconAction>
          <IconAction label="Eliminar" onClick={onDelete} danger>
            <Trash2 size={16} />
          </IconAction>
          <PublishCatalogButton count={count} isLoading={publishing} onClick={onPublish} />
        </div>
      </div>
    </div>
  );
}

function IconAction({
  children,
  label,
  onClick,
  danger,
  busy,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
  danger?: boolean;
  busy?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={busy}
      className={`inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-2 text-xs transition hover:bg-elevated disabled:opacity-50 ${
        danger ? "text-danger" : "text-muted hover:text-fg"
      }`}
    >
      {children}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}
