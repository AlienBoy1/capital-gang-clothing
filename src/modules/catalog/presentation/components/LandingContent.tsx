"use client";

import Image from "next/image";
import Link from "next/link";
import { LANDING_IMAGES } from "@/modules/catalog/presentation/data/landing-images";
import { FadeInSection } from "@/shared/ui/animations/FadeInSection";
import { ImageLightbox, useLightbox } from "@/shared/ui/components/ImageLightbox";

const worlds = [
  {
    href: "/tienda",
    label: "Tienda",
    title: "Ropa urbana",
    copy: "Colecciones con actitud, cortes limpios y detalles que hablan por sí solos.",
    image: LANDING_IMAGES.worlds.clothing,
  },
  {
    href: "/tattoo-shop",
    label: "Tattoo Shop",
    title: "Material profesional",
    copy: "Tintas, agujas y equipo pensado para sesiones reales de estudio.",
    image: LANDING_IMAGES.worlds.tattooShop,
  },
  {
    href: "/galeria",
    label: "Galería",
    title: "Tinta en piel",
    copy: "Portafolio de estilos, líneas y piezas que definen la identidad del shop.",
    image: LANDING_IMAGES.worlds.gallery,
  },
];

export function LandingContent() {
  const lookbook = useLightbox([...LANDING_IMAGES.lookbook]);
  const philosophy = useLightbox([LANDING_IMAGES.philosophy]);

  return (
    <>
      <FadeInSection className="page-shell py-16 sm:py-24">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="section-label">Lookbook</p>
            <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Calle, textura, actitud
            </h2>
          </div>
          <p className="hidden max-w-xs text-right text-sm text-muted sm:block">
            Toca cualquier imagen para abrirla a pantalla completa.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-4 md:gap-4">
          {LANDING_IMAGES.lookbook.map((image, index) => (
            <button
              key={image.src}
              type="button"
              onClick={() => lookbook.show(index)}
              className={`group relative overflow-hidden rounded-xl border border-line bg-elevated sm:rounded-2xl ${
                index % 2 === 0 ? "aspect-[3/4]" : "aspect-[4/5] sm:aspect-[3/4]"
              }`}
            >
              <Image
                src={image.src}
                alt={image.alt}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover transition duration-700 group-hover:scale-[1.05]"
              />
              <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent p-2.5 text-left text-[0.65rem] text-white sm:p-3 sm:text-xs sm:opacity-0 sm:transition sm:group-hover:opacity-100">
                {image.alt}
              </span>
            </button>
          ))}
        </div>
      </FadeInSection>

      <section className="border-y border-line">
        <div className="grid lg:grid-cols-2">
          <FadeInSection className="relative min-h-[420px] lg:min-h-full">
            <button
              type="button"
              className="absolute inset-0"
              onClick={() => philosophy.show(0)}
              aria-label="Abrir imagen de filosofía"
            >
              <Image
                src={LANDING_IMAGES.philosophy.src}
                alt={LANDING_IMAGES.philosophy.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
              />
            </button>
          </FadeInSection>
          <FadeInSection delay={80} className="flex flex-col justify-center bg-surface px-6 py-16 sm:px-12 sm:py-24 lg:px-16">
            <p className="section-label">Filosofía</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight text-fg sm:text-5xl">
              Nacido en la calle.
              <span className="mt-1 block text-muted">Creciendo como comunidad.</span>
            </h2>
            <p className="mt-5 max-w-md text-base leading-relaxed text-muted sm:text-lg">
              Capital Gang une moda urbana y tatuaje profesional bajo la misma actitud: autenticidad sin concesiones.
            </p>
          </FadeInSection>
        </div>
      </section>

      <section className="page-shell py-16 sm:py-24">
        <FadeInSection className="mb-10">
          <p className="section-label">Mundos</p>
          <h2 className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl">
            Tres entradas. Una marca.
          </h2>
        </FadeInSection>

        <div className="grid gap-3 sm:gap-4 md:grid-cols-3">
          {worlds.map((world, index) => (
            <FadeInSection key={world.href} delay={index * 70}>
              <Link
                href={world.href}
                className="group relative block aspect-[5/4] overflow-hidden rounded-xl border border-line sm:rounded-2xl md:aspect-[4/5]"
              >
                <Image
                  src={world.image.src}
                  alt={world.image.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition duration-700 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                  <p className="text-[0.65rem] uppercase tracking-[0.24em] text-brand">{world.label}</p>
                  <h3 className="mt-2 font-display text-2xl font-bold text-white">{world.title}</h3>
                  <p className="mt-2 max-w-xs text-sm text-white/70">{world.copy}</p>
                  <span className="mt-4 inline-flex text-sm font-medium text-brand transition group-hover:translate-x-1">
                    Entrar →
                  </span>
                </div>
              </Link>
            </FadeInSection>
          ))}
        </div>
      </section>

      <FadeInSection className="page-shell pb-20 sm:pb-28">
        <div className="relative overflow-hidden rounded-[1.75rem] border border-line">
          <Image
            src={LANDING_IMAGES.lookbook[1]!.src}
            alt=""
            fill
            sizes="100vw"
            className="object-cover opacity-40"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-canvas via-canvas/90 to-canvas/55" />
          <div className="relative px-6 py-14 sm:px-12 sm:py-16">
            <p className="section-label">Próximo paso</p>
            <h2 className="mt-4 max-w-xl font-display text-3xl font-bold tracking-tight sm:text-4xl">
              ¿Listo para la siguiente pieza o sesión?
            </h2>
            <p className="mt-4 max-w-lg text-muted">
              Explora el catálogo o escríbenos directo. Respondemos por WhatsApp y redes.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/tienda"
                className="inline-flex items-center justify-center rounded-full bg-brand px-6 py-3 text-sm font-semibold text-brand-fg"
              >
                Ir a la tienda
              </Link>
              <Link
                href="/contacto"
                className="inline-flex items-center justify-center rounded-full border border-line bg-surface/80 px-6 py-3 text-sm font-semibold text-fg backdrop-blur"
              >
                Contactar
              </Link>
            </div>
          </div>
        </div>
      </FadeInSection>

      <ImageLightbox {...lookbook.props} />
      <ImageLightbox {...philosophy.props} />
    </>
  );
}
