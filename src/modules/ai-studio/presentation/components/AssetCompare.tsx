"use client";

import Image from "next/image";
import { Button } from "@/shared/ui/components/Button";
import { AI_ASSET_TYPE_LABELS, formatBytes } from "../../domain/entities";
import type { AIVersionDTO } from "../types";

export function AssetCompare({
  versions,
  onRestore,
}: {
  versions: AIVersionDTO[];
  onRestore: (versionId: string) => void;
}) {
  if (versions.length < 2) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-4 py-10 text-center text-sm text-muted">
        Selecciona al menos 2 versiones para comparar.
      </div>
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {versions.map((version) => (
        <div key={version.id} className="panel overflow-hidden p-0">
          <div className="relative aspect-square bg-elevated">
            <Image src={version.storagePath} alt="" fill sizes="320px" className="object-contain" />
          </div>
          <div className="space-y-2 p-3">
            <p className="text-sm font-semibold text-fg">
              v{version.versionNumber} · {AI_ASSET_TYPE_LABELS[version.processingType]}
            </p>
            <dl className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-muted">
              <dt>Fecha</dt>
              <dd className="text-right text-fg">
                {new Date(version.createdAt).toLocaleDateString("es-MX")}
              </dd>
              <dt>Resolución</dt>
              <dd className="text-right text-fg">
                {version.width && version.height ? `${version.width}×${version.height}` : "—"}
              </dd>
              <dt>Peso</dt>
              <dd className="text-right text-fg">{formatBytes(version.size)}</dd>
              <dt>MIME</dt>
              <dd className="text-right text-fg">{version.mime}</dd>
            </dl>
            <Button
              type="button"
              size="sm"
              variant={version.isCurrent ? "secondary" : "primary"}
              className="w-full"
              disabled={version.isCurrent}
              onClick={() => onRestore(version.id)}
            >
              {version.isCurrent ? "Versión actual" : "Restaurar esta versión"}
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
