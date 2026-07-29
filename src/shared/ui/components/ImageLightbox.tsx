"use client";

import Image from "next/image";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/shared/lib/cn";

export interface LightboxImage {
  src: string;
  alt?: string;
}

interface ImageLightboxProps {
  images: LightboxImage[];
  index: number;
  open: boolean;
  onClose: () => void;
  onIndexChange?: (index: number) => void;
}

export function ImageLightbox({ images, index, open, onClose, onIndexChange }: ImageLightboxProps) {
  const [mounted, setMounted] = useState(false);
  const current = images[index];

  useEffect(() => setMounted(true), []);

  const go = useCallback(
    (next: number) => {
      if (!images.length) return;
      const wrapped = (next + images.length) % images.length;
      onIndexChange?.(wrapped);
    },
    [images.length, onIndexChange]
  );

  useEffect(() => {
    if (!open) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowRight") go(index + 1);
      if (event.key === "ArrowLeft") go(index - 1);
    };

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, index, go, onClose]);

  if (!mounted || !open || !current) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/92 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-label="Visor de imágenes"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute right-4 top-4 z-10 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
        aria-label="Cerrar"
      >
        <X size={20} />
      </button>

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(index - 1);
            }}
            className="absolute left-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 sm:left-6"
            aria-label="Anterior"
          >
            <ChevronLeft size={22} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              go(index + 1);
            }}
            className="absolute right-3 top-1/2 z-10 -translate-y-1/2 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-white/10 text-white transition hover:bg-white/20 sm:right-6"
            aria-label="Siguiente"
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <div
        className="relative mx-4 flex h-[78vh] w-full max-w-5xl items-center justify-center"
        onClick={(e) => e.stopPropagation()}
      >
        <Image
          src={current.src}
          alt={current.alt || "Imagen"}
          fill
          sizes="100vw"
          className="object-contain"
          priority
        />
      </div>

      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 rounded-full border border-white/15 bg-white/10 px-4 py-1.5 text-xs text-white/80">
        {index + 1} / {images.length}
        {current.alt ? ` · ${current.alt}` : ""}
      </div>

      {images.length > 1 && (
        <div
          className="absolute bottom-14 left-1/2 flex max-w-[90vw] -translate-x-1/2 gap-2 overflow-x-auto px-2"
          onClick={(e) => e.stopPropagation()}
        >
          {images.map((image, i) => (
            <button
              key={`${image.src}-${i}`}
              type="button"
              onClick={() => onIndexChange?.(i)}
              className={cn(
                "relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border transition",
                i === index ? "border-brand opacity-100" : "border-white/20 opacity-55 hover:opacity-90"
              )}
            >
              <Image src={image.src} alt="" fill sizes="48px" className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>,
    document.body
  );
}

/** Helper hook for opening a lightbox from any gallery. */
export function useLightbox(images: LightboxImage[] = []) {
  const [open, setOpen] = useState(false);
  const [index, setIndex] = useState(0);

  const show = (at = 0) => {
    setIndex(at);
    setOpen(true);
  };

  return {
    open,
    index,
    show,
    close: () => setOpen(false),
    setIndex,
    props: {
      images,
      index,
      open,
      onClose: () => setOpen(false),
      onIndexChange: setIndex,
    } satisfies ImageLightboxProps,
  };
}
