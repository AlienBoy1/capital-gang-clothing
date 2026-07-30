"use client";

import Image from "next/image";
import { useState } from "react";
import { cn } from "@/shared/lib/cn";
import { GalleryAlbumModal } from "@/modules/gallery/presentation/components/GalleryAlbumModal";

export interface GalleryAlbumCardData {
  id: string;
  title: string;
  slug: string;
  style: string;
  description?: string | null;
  coverImage?: string | null;
  photos: Array<{ id: string; url: string; alt?: string | null; isCover: boolean }>;
}

export function GalleryAlbumCard({ album, className }: { album: GalleryAlbumCardData; className?: string }) {
  const [open, setOpen] = useState(false);
  const cover =
    album.coverImage ||
    album.photos.find((photo) => photo.isCover)?.url ||
    album.photos[0]?.url ||
    null;

  return (
    <article className={cn("group", className)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="relative block aspect-[3/4] w-full overflow-hidden rounded-2xl border border-line bg-elevated text-left"
      >
        {cover ? (
          <Image
            src={cover}
            alt={album.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition duration-700 group-hover:scale-[1.04]"
          />
        ) : (
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_40%_30%,var(--brand-soft),transparent_50%),linear-gradient(180deg,var(--elevated),var(--surface))]" />
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/25 to-transparent p-3 pt-12 sm:p-4 sm:pt-16">
          <p className="text-[0.55rem] uppercase tracking-[0.18em] text-brand sm:text-[0.65rem] sm:tracking-[0.22em]">
            {album.style}
          </p>
          <h2 className="mt-1 font-display text-base font-semibold text-white sm:text-xl">{album.title}</h2>
          <p className="mt-1 text-[0.65rem] text-white/70 sm:text-xs">
            {album.photos.length > 0 ? `${album.photos.length} fotos · ` : ""}
            tocar para ver
          </p>
        </div>
      </button>
      {album.description && <p className="mt-3 line-clamp-2 text-sm text-muted">{album.description}</p>}
      <GalleryAlbumModal album={open ? album : null} onClose={() => setOpen(false)} />
    </article>
  );
}
