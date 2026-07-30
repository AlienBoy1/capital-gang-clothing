"use client";

import Image from "next/image";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/cn";
import type { GalleryAlbumCardData } from "@/modules/gallery/presentation/components/GalleryAlbumCard";

interface GalleryAlbumModalProps {
  album: GalleryAlbumCardData | null;
  onClose: () => void;
}

export function GalleryAlbumModal({ album, onClose }: GalleryAlbumModalProps) {
  const [mounted, setMounted] = useState(false);
  const [active, setActive] = useState(0);

  useEffect(() => setMounted(true), []);
  useEffect(() => setActive(0), [album?.id]);

  useEffect(() => {
    if (!album) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [album, onClose]);

  if (!mounted || !album) return null;

  const photos =
    album.photos.length > 0
      ? album.photos
      : album.coverImage
        ? [{ id: "cover", url: album.coverImage, alt: album.title, isCover: true }]
        : [];
  const current = photos[active];

  return createPortal(
    <div className="fixed inset-0 z-[85] flex items-end justify-center sm:items-center sm:p-6">
      <button type="button" className="absolute inset-0 bg-black/70" aria-label="Cerrar" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative z-10 flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-line bg-canvas shadow-soft sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
          <div>
            <p className="section-label">{album.style}</p>
            <h2 className="font-display text-xl font-semibold">{album.title}</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-line bg-elevated"
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto">
          <div className="relative aspect-[4/5] bg-elevated sm:aspect-[16/10]">
            {current ? (
              <Image
                src={current.url}
                alt={current.alt || album.title}
                fill
                sizes="100vw"
                className="object-contain bg-black/40"
                priority
              />
            ) : (
              <div className="absolute inset-0 bg-brand-soft" />
            )}
          </div>
          <div className="space-y-4 p-5 sm:p-6">
            {album.description && (
              <p className="text-sm leading-relaxed text-muted whitespace-pre-wrap">{album.description}</p>
            )}
            {photos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {photos.map((photo, index) => (
                  <button
                    key={photo.id}
                    type="button"
                    onClick={() => setActive(index)}
                    className={cn(
                      "relative h-16 w-14 shrink-0 overflow-hidden rounded-lg border",
                      index === active ? "border-brand" : "border-line"
                    )}
                  >
                    <Image src={photo.url} alt="" fill sizes="56px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
