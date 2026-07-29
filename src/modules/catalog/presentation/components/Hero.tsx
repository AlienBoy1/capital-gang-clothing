"use client";

import Image from "next/image";
import Link from "next/link";
import { LANDING_IMAGES } from "@/modules/catalog/presentation/data/landing-images";
import { Button } from "@/shared/ui/components/Button";

export function Hero() {
  return (
    <section className="relative flex min-h-[min(100svh,960px)] flex-col justify-end overflow-hidden">
      <Image
        src={LANDING_IMAGES.hero.src}
        alt={LANDING_IMAGES.hero.alt}
        fill
        priority
        sizes="100vw"
        className="object-cover object-[center_30%] animate-scale-in"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas via-canvas/75 to-canvas/25 dark:from-canvas dark:via-canvas/80 dark:to-black/35"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,var(--glow),transparent_50%)]"
        aria-hidden
      />

      <div className="page-shell relative z-10 pb-16 pt-32 sm:pb-24 sm:pt-40">
        <p className="section-label mb-5 animate-fade-up opacity-0 [animation-fill-mode:forwards]">
          Ropa urbana · Tattoo · Galería
        </p>

        <h1 className="max-w-5xl animate-fade-up font-display text-[clamp(2.85rem,11vw,7rem)] font-extrabold leading-[0.9] tracking-tight text-fg opacity-0 [animation-delay:90ms] [animation-fill-mode:forwards]">
          Capital Gang
          <span className="mt-1 block text-brand">Clothing</span>
        </h1>

        <p className="mt-6 max-w-lg animate-fade-up text-base leading-relaxed text-muted opacity-0 sm:text-lg [animation-delay:160ms] [animation-fill-mode:forwards]">
          Una identidad. Dos mundos. Piezas que se viven en la calle y tinta que se lleva para siempre.
        </p>

        <div className="mt-10 flex animate-fade-up flex-col gap-3 opacity-0 sm:flex-row [animation-delay:230ms] [animation-fill-mode:forwards]">
          <Link href="/tienda">
            <Button size="lg" variant="primary" className="w-full sm:w-auto">
              Explorar colección
            </Button>
          </Link>
          <Link href="/galeria">
            <Button size="lg" variant="secondary" className="w-full sm:w-auto">
              Ver galería
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
