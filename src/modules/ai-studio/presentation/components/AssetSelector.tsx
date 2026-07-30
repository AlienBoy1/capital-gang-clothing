"use client";

import Image from "next/image";
import { cn } from "@/shared/lib/cn";
import { AI_ASSET_TYPE_LABELS } from "../../domain/entities";
import type { AIAssetDTO } from "../types";

export function AssetSelector({
  assets,
  activeId,
  onSelect,
  className,
}: {
  assets: AIAssetDTO[];
  activeId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible", className)}>
      {assets.map((asset) => {
        const cover = asset.currentVersion?.storagePath;
        const type = asset.currentVersion?.processingType ?? asset.assetType;
        return (
          <button
            key={asset.id}
            type="button"
            onClick={() => onSelect(asset.id)}
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-xl border px-2.5 py-2 text-left text-xs transition lg:w-full",
              activeId === asset.id
                ? "border-brand bg-brand-soft text-brand"
                : "border-line text-muted hover:text-fg"
            )}
          >
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg bg-elevated">
              {cover && <Image src={cover} alt="" fill sizes="36px" className="object-cover" />}
            </span>
            <span className="min-w-0">
              <span className="block truncate font-medium">{AI_ASSET_TYPE_LABELS[type]}</span>
              <span className="block text-[10px] opacity-70">{asset.versions.length} vers.</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
