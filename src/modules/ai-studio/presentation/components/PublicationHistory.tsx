"use client";

import Link from "next/link";
import Image from "next/image";
import type { CatalogPublicationDTO } from "../types";

export function PublicationHistory({ publications }: { publications: CatalogPublicationDTO[] }) {
  if (!publications.length) {
    return (
      <div className="rounded-2xl border border-dashed border-line px-4 py-8 text-center text-sm text-muted">
        Aún no hay publicaciones de este proyecto.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {publications.map((pub) => (
        <div key={pub.id} className="panel p-4">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <div>
              <p className="text-sm font-semibold text-fg">
                {pub.product?.name ?? "Publicación pendiente de producto"}
              </p>
              <p className="mt-1 text-xs text-muted">
                {new Date(pub.publishedAt).toLocaleString("es-MX")} · {pub.status}
                {pub.publishedBy
                  ? ` · ${pub.publishedBy.firstName} ${pub.publishedBy.lastName}`
                  : ""}
              </p>
            </div>
            {pub.product && (
              <Link
                href="/dashboard/productos"
                className="text-xs text-brand hover:underline"
              >
                Ver en catálogo
              </Link>
            )}
          </div>
          <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
            {pub.assets.map((item) => (
              <div
                key={item.id}
                className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-elevated"
              >
                <Image
                  src={item.assetVersion.storagePath}
                  alt=""
                  fill
                  sizes="56px"
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
