"use client";

import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";
import { ImageLightbox, useLightbox } from "@/shared/ui/components/ImageLightbox";

interface ImageUploaderProps {
  value: string[];
  onChange: (urls: string[]) => void;
  maxFiles?: number;
  className?: string;
  label?: string;
}

export function ImageUploader({
  value,
  onChange,
  maxFiles = 8,
  className,
  label = "Imágenes",
}: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lightbox = useLightbox(value.map((src) => ({ src })));

  async function handleFiles(files: FileList | null) {
    if (!files?.length) return;
    const remaining = maxFiles - value.length;
    if (remaining <= 0) {
      setError(`Máximo ${maxFiles} imágenes`);
      return;
    }

    const selected = Array.from(files).slice(0, remaining);
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      selected.forEach((file) => formData.append("files", file));

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "No se pudieron subir las imágenes");
        return;
      }

      const urls = (data.urls as string[]) ?? [];
      onChange([...value, ...urls]);
    } catch {
      setError("Error de red al subir imágenes");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(index: number) {
    onChange(value.filter((_, i) => i !== index));
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-fg">{label}</p>
        <p className="text-xs text-subtle">
          {value.length}/{maxFiles}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {value.map((url, index) => (
          <div key={`${url}-${index}`} className="group relative aspect-square overflow-hidden rounded-xl border border-line bg-elevated">
            <button
              type="button"
              onClick={() => lightbox.show(index)}
              className="absolute inset-0"
              aria-label="Abrir imagen"
            >
              <Image src={url} alt="" fill sizes="160px" className="object-cover" />
            </button>
            {index === 0 && (
              <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-brand px-2 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wider text-brand-fg">
                Portada
              </span>
            )}
            <button
              type="button"
              onClick={() => removeAt(index)}
              className="absolute right-2 top-2 z-10 inline-flex h-7 w-7 items-center justify-center rounded-full bg-canvas/80 text-fg opacity-0 transition group-hover:opacity-100"
              aria-label="Quitar imagen"
            >
              <X size={14} />
            </button>
          </div>
        ))}

        {value.length < maxFiles && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="flex aspect-square flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-line bg-elevated/50 text-muted transition hover:border-brand hover:text-brand disabled:opacity-60"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <ImagePlus size={20} />}
            <span className="text-xs font-medium">{uploading ? "Subiendo…" : "Adjuntar"}</span>
          </button>
        )}
      </div>

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {error && <p className="text-xs text-danger">{error}</p>}
      <p className="text-xs text-subtle">JPG, PNG o WebP. Toca una imagen para abrirla. La primera es portada.</p>

      <ImageLightbox {...lightbox.props} images={value.map((src) => ({ src }))} />
    </div>
  );
}
