import { GalleryAlbumCard } from "@/modules/gallery/presentation/components/GalleryAlbumCard";
import { prisma } from "@/shared/lib/prisma";
import { FadeInSection } from "@/shared/ui/animations/FadeInSection";

export const metadata = {
  title: "Galería",
};

export default async function GaleriaPage() {
  const albums = await prisma.galleryAlbum
    .findMany({
      include: { photos: { orderBy: { order: "asc" } } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    })
    .catch(() => []);

  return (
    <main className="page-shell py-12 sm:py-16">
      <FadeInSection>
        <p className="section-label">Galería</p>
        <h1 className="mt-3 max-w-3xl font-display text-4xl font-bold tracking-tight sm:text-5xl">
          Portafolio de tinta
        </h1>
        <p className="mt-4 max-w-2xl text-muted">
          Estilos, líneas y piezas que cuentan la historia visual del shop.
        </p>
      </FadeInSection>

      {albums.length === 0 ? (
        <div className="mt-12 rounded-2xl border border-dashed border-line bg-surface px-6 py-16 text-center">
          <p className="font-display text-xl font-semibold">Galería vacía</p>
          <p className="mt-2 text-sm text-muted">Los álbumes publicados se mostrarán aquí.</p>
        </div>
      ) : (
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album, index) => (
            <FadeInSection key={album.id} delay={index * 50}>
              <GalleryAlbumCard album={album} />
            </FadeInSection>
          ))}
        </div>
      )}
    </main>
  );
}
