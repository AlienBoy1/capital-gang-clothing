"use client";

import Image from "next/image";
import { Pencil, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ImageUploader } from "@/shared/ui/components/ImageUploader";
import { ImageLightbox } from "@/shared/ui/components/ImageLightbox";
import { Button } from "@/shared/ui/components/Button";

interface AlbumItem {
  id: string;
  title: string;
  slug: string;
  style: string;
  description?: string | null;
  coverImage?: string | null;
  photos: Array<{ id: string; url: string; alt?: string | null }>;
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function GalleryManager() {
  const [albums, setAlbums] = useState<AlbumItem[]>([]);
  const [photos, setPhotos] = useState<string[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", slug: "", style: "", description: "" });
  const [viewer, setViewer] = useState<{
    images: Array<{ src: string; alt?: string }>;
    index: number;
  } | null>(null);

  async function loadAlbums() {
    setLoading(true);
    const res = await fetch("/api/gallery");
    if (res.ok) setAlbums(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    loadAlbums();
  }, []);

  function resetForm() {
    setEditingId(null);
    setForm({ title: "", slug: "", style: "", description: "" });
    setPhotos([]);
    setError(null);
  }

  function startEdit(album: AlbumItem) {
    setEditingId(album.id);
    setForm({
      title: album.title,
      slug: album.slug,
      style: album.style,
      description: album.description ?? "",
    });
    setPhotos(album.photos?.map((photo) => photo.url) ?? (album.coverImage ? [album.coverImage] : []));
    setError(null);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    const photoPayload = photos.map((url, index) => ({
      url,
      alt: form.title,
      isCover: index === 0,
    }));

    if (editingId) {
      const res = await fetch(`/api/gallery/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          coverImage: photos[0] ?? null,
          photos: photoPayload,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.message ?? "No se pudo actualizar el álbum");
        setSaving(false);
        return;
      }
    } else {
      const createRes = await fetch("/api/gallery", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          coverImage: photos[0] ?? undefined,
          order: 0,
        }),
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        setError(data.message ?? "No se pudo crear el álbum");
        setSaving(false);
        return;
      }

      const album = await createRes.json();

      if (photos.length) {
        await fetch(`/api/gallery/${album.id}/photos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ replace: true, photos: photoPayload }),
        });
      }
    }

    resetForm();
    setSaving(false);
    loadAlbums();
  }

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este álbum y sus fotos?")) return;
    const res = await fetch(`/api/gallery/${id}`, { method: "DELETE" });
    if (res.ok) {
      if (editingId === id) resetForm();
      loadAlbums();
    }
  }

  function openAlbum(album: AlbumItem, at = 0) {
    const images =
      album.photos?.length > 0
        ? album.photos.map((photo) => ({ src: photo.url, alt: photo.alt || album.title }))
        : album.coverImage
          ? [{ src: album.coverImage, alt: album.title }]
          : [];
    if (!images.length) return;
    setViewer({ images, index: at });
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="panel space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-fg">{editingId ? "Editando álbum" : "Nuevo álbum"}</p>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1.5 rounded-full border border-line px-3 py-1.5 text-xs text-muted transition hover:text-fg"
            >
              <X size={14} />
              Cancelar edición
            </button>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={form.title}
            onChange={(e) => {
              const title = e.target.value;
              setForm((prev) => ({
                ...prev,
                title,
                slug:
                  editingId || (prev.slug && prev.slug !== slugify(prev.title))
                    ? prev.slug
                    : slugify(title),
              }));
            }}
            placeholder="Título del álbum"
            required
            className="input-field"
          />
          <input
            value={form.slug}
            onChange={(e) => setForm({ ...form, slug: e.target.value })}
            placeholder="Slug"
            required
            className="input-field"
          />
          <input
            value={form.style}
            onChange={(e) => setForm({ ...form, style: e.target.value })}
            placeholder="Estilo (Realismo, Blackwork…)"
            required
            className="input-field md:col-span-2"
          />
        </div>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          placeholder="Descripción"
          className="input-field min-h-24"
        />
        <ImageUploader value={photos} onChange={setPhotos} label="Fotos del álbum" maxFiles={16} />
        {error && <p className="text-sm text-danger">{error}</p>}
        <Button type="submit" isLoading={saving}>
          {editingId ? "Actualizar álbum" : "Guardar álbum"}
        </Button>
      </form>

      <div className="space-y-4">
        <h2 className="font-display text-lg font-semibold">Álbumes ({albums.length})</h2>
        {loading ? (
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton h-48" />
            ))}
          </div>
        ) : albums.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-line px-6 py-12 text-center text-sm text-muted">
            Crea un álbum y adjunta las fotos del portafolio.
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {albums.map((album) => {
              const cover = album.coverImage || album.photos?.[0]?.url;
              const isEditing = editingId === album.id;
              return (
                <div
                  key={album.id}
                  className={`panel overflow-hidden p-0 ${isEditing ? "border-brand/50 ring-1 ring-brand/30" : ""}`}
                >
                  <button
                    type="button"
                    onClick={() => openAlbum(album)}
                    className="relative block h-40 w-full bg-elevated"
                    disabled={!cover}
                    aria-label="Abrir fotos del álbum"
                  >
                    {cover ? (
                      <Image src={cover} alt={album.title} fill sizes="400px" className="object-cover" />
                    ) : null}
                  </button>
                  <div className="space-y-3 p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-[0.65rem] uppercase tracking-[0.2em] text-brand">{album.style}</p>
                        <h3 className="mt-1 font-semibold text-fg">{album.title}</h3>
                        <p className="mt-1 text-xs text-muted">{album.photos?.length ?? 0} fotos · tocar portada para ver</p>
                      </div>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => startEdit(album)}
                          className="rounded-lg p-2 text-muted transition hover:bg-elevated hover:text-brand"
                          aria-label="Editar álbum"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(album.id)}
                          className="rounded-lg p-2 text-muted transition hover:bg-elevated hover:text-danger"
                          aria-label="Eliminar álbum"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <ImageLightbox
        open={Boolean(viewer)}
        images={viewer?.images ?? []}
        index={viewer?.index ?? 0}
        onClose={() => setViewer(null)}
        onIndexChange={(index) => setViewer((current) => (current ? { ...current, index } : null))}
      />
    </div>
  );
}
