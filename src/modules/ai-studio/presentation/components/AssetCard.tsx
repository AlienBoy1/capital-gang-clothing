"use client";

import Image from "next/image";
import { Heart, Layers } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import { AI_ASSET_TYPE_LABELS } from "../../domain/entities";
import type { AIAssetDTO } from "../types";
import { ProcessingStatus } from "./ProcessingStatus";

export function AssetCard({
  asset,
  selected,
  onSelect,
  onOpen,
  view = "grid",
}: {
  asset: AIAssetDTO;
  selected: boolean;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
  view?: "grid" | "list";
}) {
  const cover = asset.currentVersion?.storagePath;
  const type = asset.currentVersion?.processingType ?? asset.assetType;

  if (view === "list") {
    return (
      <div
        className={cn(
          "panel flex items-center gap-3 p-3 transition",
          selected && "border-brand/50 ring-1 ring-brand/30"
        )}
      >
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(asset.id)}
          className="h-4 w-4 accent-[var(--brand)]"
          aria-label="Seleccionar asset"
        />
        <button
          type="button"
          onClick={() => onOpen(asset.id)}
          className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-elevated"
        >
          {cover ? (
            <Image src={cover} alt="" fill sizes="56px" className="object-cover" />
          ) : (
            <div className="absolute inset-0 bg-brand-soft" />
          )}
        </button>
        <button type="button" onClick={() => onOpen(asset.id)} className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-medium text-fg">{AI_ASSET_TYPE_LABELS[type]}</p>
          <p className="mt-0.5 text-xs text-muted">
            v{asset.currentVersion?.versionNumber ?? 1} · {asset.versions.length} versiones
          </p>
        </button>
        <ProcessingStatus status={asset.status} />
        {asset.favorite && <Heart size={14} className="fill-brand text-brand" />}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl border border-line bg-surface transition",
        selected && "border-brand/60 ring-2 ring-brand/30"
      )}
    >
      <button
        type="button"
        onClick={() => onSelect(asset.id)}
        className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-lg border border-line bg-canvas/90 backdrop-blur"
        aria-label="Seleccionar"
      >
        <span
          className={cn(
            "h-3.5 w-3.5 rounded border",
            selected ? "border-brand bg-brand" : "border-line-strong bg-transparent"
          )}
        />
      </button>

      {asset.favorite && (
        <span className="absolute right-2 top-2 z-10 rounded-full bg-canvas/90 p-1.5 text-brand backdrop-blur">
          <Heart size={12} className="fill-brand" />
        </span>
      )}

      <button
        type="button"
        onClick={() => onOpen(asset.id)}
        className="relative block aspect-square w-full bg-elevated"
        style={
          asset.currentVersion?.mime === "image/png" || asset.currentVersion?.mime === "image/webp"
            ? {
                backgroundImage:
                  "linear-gradient(45deg,#c8c8c8 25%,transparent 25%),linear-gradient(-45deg,#c8c8c8 25%,transparent 25%),linear-gradient(45deg,transparent 75%,#c8c8c8 75%),linear-gradient(-45deg,transparent 75%,#c8c8c8 75%)",
                backgroundSize: "14px 14px",
                backgroundPosition: "0 0,0 7px,7px -7px,-7px 0",
              }
            : undefined
        }
      >
        {cover ? (
          <Image
            src={cover}
            alt={AI_ASSET_TYPE_LABELS[type]}
            fill
            sizes="(max-width:640px) 50vw, 220px"
            className="object-contain transition duration-500 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-subtle">
            <Layers size={24} />
          </div>
        )}
      </button>

      <div className="space-y-2 p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-xs font-medium text-fg">{AI_ASSET_TYPE_LABELS[type]}</p>
          <ProcessingStatus status={asset.status} />
        </div>
        <p className="text-[11px] text-subtle">
          v{asset.currentVersion?.versionNumber ?? 1} · {asset.versions.length} vers.
        </p>
      </div>
    </div>
  );
}
