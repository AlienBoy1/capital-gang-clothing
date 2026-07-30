import { GalleryAlbumCard } from "@/modules/gallery/presentation/components/GalleryAlbumCard";
import { prisma } from "@/shared/lib/prisma";
import { FadeInSection } from "@/shared/ui/animations/FadeInSection";

export const metadata = {
  title: "Galería",
};

export const dynamic = "force-dynamic";

export default async function GaleriaPage() {
  const albums = await prisma.galleryAlbum
    .findMany({
      include: { photos: { orderBy: { order: "asc" } } },
      orderBy: [{ order: "asc" }, { createdAt: "desc" }],
    })
    .catch(() => []);

  return (
    <main className="page-shell py-10 sm:py-16">
      <FadeInSection>
        <p className="section-label">Galería</p>
        <h1 className="mt-3 max-w-3xl font-display text-3xl font-bold tracking-tight sm:text-5xl">
          Portafolio de tinta
        </h1>
        <p className="mt-3 max-w-2xl text-sm text-muted sm:mt-4 sm:text-base">
          Estilos, líneas y piezas que cuentan la historia visual del shop.
        </p>
      </FadeInSection>

      {albums.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-line bg-surface px-6 py-14 text-center sm:mt-12 sm:py-16">
          <p className="font-display text-xl font-semibold">Galería vacía</p>
          <p className="mt-2 text-sm text-muted">Los álbumes publicados se mostrarán aquí.</p>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-12 sm:gap-5 lg:grid-cols-4 lg:gap-6">
          {albums.map((album, index) => (
            <FadeInSection key={album.id} delay={Math.min(index * 40, 200)}>
              <GalleryAlbumCard album={album} />
            </FadeInSection>
          ))}
        </div>
      )}
    </main>
  );
}
