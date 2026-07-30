"use client";

import Image from "next/image";
import Link from "next/link";
import { LANDING_IMAGES } from "@/modules/catalog/presentation/data/landing-images";
import { BrandTag } from "@/components/brand/logos";
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
        className="pointer-events-none absolute inset-0 bg-gradient-to-t from-canvas via-canvas/80 to-black/30"
        aria-hidden
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_30%_80%,var(--glow),transparent_50%)]"
        aria-hidden
      />

      <div className="page-shell relative z-10 pb-16 pt-32 sm:pb-24 sm:pt-40">
        <p className="section-label mb-4 animate-fade-up opacity-0 [animation-fill-mode:forwards]">
          Clothing · Tattoo · Culture
        </p>

        <h1 className="max-w-5xl animate-fade-up font-brand text-[clamp(2.75rem,12vw,7.2rem)] font-bold uppercase leading-[0.88] tracking-[0.02em] text-fg opacity-0 [animation-delay:90ms] [animation-fill-mode:forwards]">
          Capital Gang
          <span className="mt-2 block text-brand">Clothing</span>
        </h1>

        <p className="mt-6 max-w-lg animate-fade-up text-base leading-relaxed text-muted opacity-0 sm:text-lg [animation-delay:160ms] [animation-fill-mode:forwards]">
          Unión entre la calle, la tinta y la comunidad. Nacido del asfalto.
        </p>

        <div className="mt-6 animate-fade-up opacity-0 [animation-delay:180ms] [animation-fill-mode:forwards]">
          <BrandTag />
        </div>

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
