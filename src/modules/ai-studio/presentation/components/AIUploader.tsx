"use client";

import { ImagePlus, Loader2 } from "lucide-react";
import { useRef, useState } from "react";
import { cn } from "@/shared/lib/cn";

interface AIUploaderProps {
  onUploaded: (urls: string[]) => void | Promise<void>;
  maxFiles?: number;
  className?: string;
  label?: string;
  disabled?: boolean;
}

export function AIUploader({
  onUploaded,
  maxFiles = 12,
  className,
  label = "Subir fotografías",
  disabled,
}: AIUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  async function handleFiles(files: FileList | null) {
    if (!files?.length || disabled) return;
    const selected = Array.from(files).slice(0, maxFiles);
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      selected.forEach((file) => formData.append("files", file));
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) {
        setError(data.message ?? "No se pudieron subir las imágenes");
        return;
      }
      await onUploaded((data.urls as string[]) ?? []);
    } catch {
      setError("Error de red al subir imágenes");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      <button
        type="button"
        disabled={disabled || uploading}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed px-4 py-8 text-center transition sm:py-10",
          dragOver ? "border-brand bg-brand-soft/40" : "border-line bg-elevated/40 hover:border-brand/50 hover:bg-elevated",
          (disabled || uploading) && "opacity-60"
        )}
      >
        {uploading ? (
          <Loader2 className="animate-spin text-brand" size={28} />
        ) : (
          <ImagePlus className="text-brand" size={28} strokeWidth={1.5} />
        )}
        <div>
          <p className="text-sm font-medium text-fg">{uploading ? "Subiendo…" : label}</p>
          <p className="mt-1 text-xs text-muted">Arrastra o toca · máx. {maxFiles} · JPG, PNG, WEBP</p>
        </div>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif,image/gif"
        multiple
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {error && <p className="text-sm text-danger">{error}</p>}
    </div>
  );
}
