"use client";

import Image from "next/image";
import { cn } from "@/shared/lib/cn";
import { Isotipo, LogoPrincipal, LogoVertical, Wordmark, BrandTag } from "@/components/brand/logos";

export type BrandVariant = "mark" | "horizontal" | "vertical" | "wordmark" | "seal" | "tag";
export type BrandSize = "sm" | "md" | "lg" | "xl";

interface BrandMarkProps {
  compact?: boolean;
  variant?: BrandVariant;
  size?: BrandSize;
  className?: string;
  useRaster?: boolean;
  /** Alineación del logo horizontal (default left) */
  align?: "left" | "center";
}

const horizontalSize: Record<BrandSize, string> = {
  sm: "h-11 w-[200px] sm:h-12 sm:w-[230px]",
  md: "h-14 w-[260px] sm:h-16 sm:w-[320px]",
  lg: "h-16 w-[300px] sm:h-[4.5rem] sm:w-[380px]",
  xl: "h-[4.5rem] w-[340px] sm:h-24 sm:w-[440px]",
};

const markSize: Record<BrandSize, string> = {
  sm: "h-11 w-11",
  md: "h-14 w-14",
  lg: "h-16 w-16",
  xl: "h-20 w-20 sm:h-24 sm:w-24",
};

const sealSize: Record<BrandSize, string> = {
  sm: "h-28 w-28",
  md: "h-36 w-36 sm:h-40 sm:w-40",
  lg: "h-44 w-44 sm:h-52 sm:w-52",
  xl: "h-52 w-52 sm:h-64 sm:w-64",
};

type DualSrc = { dark: string; light: string };

function ThemeAwareLogo({
  src,
  alt,
  sizes,
  objectPosition,
  className,
}: {
  src: DualSrc;
  alt: string;
  sizes: string;
  objectPosition?: "left" | "center";
  className?: string;
}) {
  const objectClass =
    objectPosition === "center" ? "object-center" : objectPosition === "left" ? "object-left" : "";

  return (
    <div className={cn("relative shrink-0", className)}>
      {/* Modo claro: tinta oscura + lima, fondo transparente */}
      <Image
        src={src.light}
        alt={alt}
        fill
        sizes={sizes}
        className={cn(
          "object-contain drop-shadow-[0_2px_10px_rgba(10,10,10,0.12)] dark:hidden",
          objectClass
        )}
        priority
      />
      {/* Modo oscuro: blanco + lima, fondo transparente */}
      <Image
        src={src.dark}
        alt=""
        fill
        sizes={sizes}
        aria-hidden
        className={cn(
          "hidden object-contain drop-shadow-[0_0_18px_rgba(214,255,47,0.18)] dark:block",
          objectClass
        )}
        priority
      />
    </div>
  );
}

/**
 * Sistema de marca Capital Gang.
 * Assets con fondo transparente + variantes light/dark.
 */
export function BrandMark({
  compact = false,
  variant,
  size,
  className,
  useRaster = true,
  align = "left",
}: BrandMarkProps) {
  const resolved: BrandVariant = variant ?? (compact ? "mark" : "horizontal");
  const resolvedSize: BrandSize = size ?? (compact || resolved === "mark" ? "md" : "md");

  if (useRaster && resolved === "mark") {
    return (
      <ThemeAwareLogo
        src={{ dark: "/brand/isotipo-dark.png", light: "/brand/isotipo-light.png" }}
        alt="Capital Gang"
        sizes="96px"
        className={cn(markSize[resolvedSize], className)}
      />
    );
  }

  if (useRaster && resolved === "horizontal") {
    return (
      <ThemeAwareLogo
        src={{ dark: "/brand/logo-principal-dark.png", light: "/brand/logo-principal-light.png" }}
        alt="Capital Gang — Clothing · Tattoo · Culture"
        sizes="(max-width: 640px) 340px, 440px"
        objectPosition={align}
        className={cn(horizontalSize[resolvedSize], className)}
      />
    );
  }

  if (useRaster && (resolved === "seal" || resolved === "vertical")) {
    return (
      <ThemeAwareLogo
        src={{ dark: "/brand/sello-dark.png", light: "/brand/sello-light.png" }}
        alt="Capital Gang sello 2026"
        sizes="(max-width: 640px) 208px, 256px"
        className={cn(
          resolved === "vertical" ? "mx-auto h-40 w-40 sm:h-48 sm:w-48" : sealSize[resolvedSize],
          className
        )}
      />
    );
  }

  switch (resolved) {
    case "mark":
      return <Isotipo className={cn(markSize[resolvedSize], className)} />;
    case "wordmark":
      return <Wordmark className={className} />;
    case "vertical":
      return <LogoVertical className={className} />;
    case "seal":
      return (
        <ThemeAwareLogo
          src={{ dark: "/brand/sello-dark.png", light: "/brand/sello-light.png" }}
          alt="Capital Gang sello"
          sizes="224px"
          className={cn(sealSize[resolvedSize], className)}
        />
      );
    case "tag":
      return <BrandTag className={className} />;
    case "horizontal":
    default:
      return <LogoPrincipal className={className} compact={compact} />;
  }
}

export { Isotipo, LogoPrincipal, LogoVertical, Wordmark, BrandTag };
export { Sello } from "@/components/brand/Sello";
