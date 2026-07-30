import { cn } from "@/shared/lib/cn";

export { Sello } from "@/components/brand/Sello";

type LogoTone = "light" | "dark" | "brand";

const toneFill: Record<LogoTone, string> = {
  light: "currentColor",
  dark: "#0A0A0A",
  brand: "#D6FF2F",
};

/** Isotipo CG — monograma stencil con drips */
export function Isotipo({
  className,
  tone = "light",
  title = "Capital Gang",
}: {
  className?: string;
  tone?: LogoTone;
  title?: string;
}) {
  const fill = toneFill[tone];
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0 text-fg", className)}
      role="img"
      aria-label={title}
    >
      <title>{title}</title>
      <path
        fill={fill}
        d="M78 22c-8.5-6.8-19.2-9.8-30.4-8.2C26.2 16.4 12 32.8 12 54.8c0 22.4 14.4 38.8 36 41.2 11.4 1.3 22.4-1.8 30.6-8.8l-9.2-11.4c-5.2 4.2-12 6.3-19.2 5.5-13.2-1.5-22.2-12-22.2-26.5 0-14.2 8.8-24.5 21.8-26.2 7-.9 13.6 1 18.4 4.8L78 22Z"
      />
      <path
        fill={fill}
        d="M58 38c-10.8 0-19.2 8-19.2 18.8 0 10.6 8.2 18.6 19 18.6 5.4 0 10.2-1.8 13.6-5v-6.2H58.8v-11.6h28.4V82c-6.2 5.8-14.8 9.2-24.6 9.2-18.8 0-33.2-13.8-33.2-33.4C29.4 38.4 43.4 24.4 62.4 24.4c8.4 0 16 2.8 21.8 7.6l-9.4 11.2C71.2 40.2 65 38 58 38Z"
      />
      <rect x="34" y="48" width="10" height="5.5" fill="var(--canvas, #0A0A0A)" />
      <rect x="64" y="48" width="10" height="5.5" fill="var(--canvas, #0A0A0A)" />
      <path fill={fill} d="M28 94c0 4.5 1.2 9 1.2 13.2 0 2.2-1 3.4-2.2 3.4s-2.2-1.2-2.2-3.4C24.8 102.8 26 98.2 26 94h2Z" />
      <path fill={fill} d="M48 96c0 5.5 1.5 11.2 1.5 15.8 0 2.6-1.1 4-2.5 4s-2.5-1.4-2.5-4C44.5 107 46 101.4 46 96h2Z" />
      <path fill={fill} d="M72 93c0 3.8 1 7.6 1 11.2 0 1.8-.8 2.8-1.8 2.8s-1.8-1-1.8-2.8c0-3.6.9-7.4.9-11.2h1.7Z" />
      <path fill={fill} d="M88 95c0 4.2 1.1 8.4 1.1 12.2 0 2-.9 3.1-2 3.1s-2-1.1-2-3.1c0-3.8 1-8 1-12.2H88Z" />
    </svg>
  );
}

function Crown({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 16" className={cn("fill-brand", className)} aria-hidden>
      <path d="M2 13.5 5.2 5.8 9.1 10.2 12 3.2l2.9 7 3.9-4.4L21.8 13.5H2Z" />
      <circle cx="5.2" cy="4.6" r="1.3" />
      <circle cx="12" cy="2.2" r="1.3" />
      <circle cx="18.8" cy="4.6" r="1.3" />
    </svg>
  );
}

export function Wordmark({
  className,
  showTagline = true,
  showCrown = true,
  compact = false,
}: {
  className?: string;
  showTagline?: boolean;
  showCrown?: boolean;
  compact?: boolean;
}) {
  return (
    <div className={cn("leading-none", className)}>
      <div className="relative inline-block">
        {showCrown && (
          <Crown
            className={cn(
              "absolute -top-2 left-[42%] w-3 -translate-x-1/2 -rotate-12 sm:-top-2.5 sm:w-3.5",
              compact && "-top-1.5 w-2.5"
            )}
          />
        )}
        <p
          className={cn(
            "font-brand font-bold uppercase tracking-[0.04em] text-fg",
            compact ? "text-[0.7rem] leading-[0.95]" : "text-sm leading-[0.92] sm:text-base"
          )}
        >
          Capital
          <br />
          Gang
        </p>
      </div>
      {showTagline && !compact && (
        <p className="mt-1.5 text-[0.55rem] font-semibold uppercase tracking-[0.22em] text-brand sm:text-[0.6rem]">
          Clothing · Tattoo · Culture
        </p>
      )}
    </div>
  );
}

export function LogoPrincipal({
  className,
  compact = false,
}: {
  className?: string;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex items-center gap-2.5 sm:gap-3", className)}>
      <Isotipo className={compact ? "h-8 w-8" : "h-10 w-10 sm:h-11 sm:w-11"} />
      <span className="h-8 w-px bg-brand/80 sm:h-9" aria-hidden />
      <Wordmark compact={compact} showTagline={!compact} />
    </div>
  );
}

export function LogoVertical({ className }: { className?: string }) {
  return (
    <div className={cn("flex flex-col items-center text-center", className)}>
      <Isotipo className="h-16 w-16 sm:h-20 sm:w-20" />
      <div className="mt-3">
        <Wordmark showTagline />
      </div>
    </div>
  );
}

export function BrandTag({ className }: { className?: string }) {
  return (
    <p className={cn("font-tag text-lg leading-none text-brand sm:text-xl", className)}>
      Capital Gang
      <span className="mt-0.5 block text-[0.65em] tracking-wide">→</span>
    </p>
  );
}
