"use client";

import { LayoutGrid, List, Search, Star } from "lucide-react";
import { useMemo, useState } from "react";
import type { AIAssetStatus, AIAssetType } from "../../domain/entities";
import { AI_ASSET_STATUS_LABELS, AI_ASSET_TYPE_LABELS } from "../../domain/entities";
import type { AIAssetDTO } from "../types";
import { AssetCard } from "./AssetCard";
import { cn } from "@/shared/lib/cn";

type SortKey = "newest" | "oldest" | "type" | "versions";

export function AssetGallery({
  assets,
  selectedIds,
  onSelect,
  onOpen,
}: {
  assets: AIAssetDTO[];
  selectedIds: Set<string>;
  onSelect: (id: string) => void;
  onOpen: (id: string) => void;
}) {
  const [view, setView] = useState<"grid" | "list">("grid");
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"ALL" | AIAssetStatus>("ALL");
  const [type, setType] = useState<"ALL" | AIAssetType>("ALL");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>("newest");

  const filtered = useMemo(() => {
    let list = [...assets];

    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((asset) => {
        const label = AI_ASSET_TYPE_LABELS[asset.currentVersion?.processingType ?? asset.assetType];
        return label.toLowerCase().includes(q) || asset.id.toLowerCase().includes(q);
      });
    }
    if (status !== "ALL") list = list.filter((a) => a.status === status);
    if (type !== "ALL") {
      list = list.filter(
        (a) => a.assetType === type || a.currentVersion?.processingType === type
      );
    }
    if (favoritesOnly) list = list.filter((a) => a.favorite);

    list.sort((a, b) => {
      if (sort === "oldest") {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sort === "type") {
        return (a.currentVersion?.processingType ?? "").localeCompare(
          b.currentVersion?.processingType ?? ""
        );
      }
      if (sort === "versions") return b.versions.length - a.versions.length;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return list;
  }, [assets, query, status, type, favoritesOnly, sort]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <label className="relative min-w-0 flex-1">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar assets…"
              className="input-field w-full pl-9"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as "ALL" | AIAssetStatus)}
              className="input-field min-w-[8rem]"
            >
              <option value="ALL">Todos los estados</option>
              {(Object.keys(AI_ASSET_STATUS_LABELS) as AIAssetStatus[]).map((key) => (
                <option key={key} value={key}>
                  {AI_ASSET_STATUS_LABELS[key]}
                </option>
              ))}
            </select>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as "ALL" | AIAssetType)}
              className="input-field min-w-[8rem]"
            >
              <option value="ALL">Todos los tipos</option>
              {(Object.keys(AI_ASSET_TYPE_LABELS) as AIAssetType[]).map((key) => (
                <option key={key} value={key}>
                  {AI_ASSET_TYPE_LABELS[key]}
                </option>
              ))}
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortKey)}
              className="input-field min-w-[8rem]"
            >
              <option value="newest">Más recientes</option>
              <option value="oldest">Más antiguos</option>
              <option value="type">Por tipo</option>
              <option value="versions">Más versiones</option>
            </select>
            <button
              type="button"
              onClick={() => setFavoritesOnly((v) => !v)}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs",
                favoritesOnly
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-line text-muted hover:text-fg"
              )}
            >
              <Star size={14} /> Favoritos
            </button>
            <div className="inline-flex rounded-full border border-line p-0.5">
              <button
                type="button"
                onClick={() => setView("grid")}
                className={cn(
                  "rounded-full p-2",
                  view === "grid" ? "bg-elevated text-fg" : "text-muted"
                )}
                aria-label="Vista grid"
              >
                <LayoutGrid size={16} />
              </button>
              <button
                type="button"
                onClick={() => setView("list")}
                className={cn(
                  "rounded-full p-2",
                  view === "list" ? "bg-elevated text-fg" : "text-muted"
                )}
                aria-label="Vista lista"
              >
                <List size={16} />
              </button>
            </div>
          </div>
        </div>
        <p className="text-xs text-subtle">
          {filtered.length} de {assets.length} assets
        </p>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-sm text-muted">
          No hay assets con estos filtros. Sube fotografías o ajusta la búsqueda.
        </div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {filtered.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              selected={selectedIds.has(asset.id)}
              onSelect={onSelect}
              onOpen={onOpen}
              view="grid"
            />
          ))}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((asset) => (
            <AssetCard
              key={asset.id}
              asset={asset}
              selected={selectedIds.has(asset.id)}
              onSelect={onSelect}
              onOpen={onOpen}
              view="list"
            />
          ))}
        </div>
      )}
    </div>
  );
}
