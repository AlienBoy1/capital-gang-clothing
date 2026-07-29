import { cn } from "@/shared/lib/cn";

interface BrandMarkProps {
  compact?: boolean;
  className?: string;
}

export function BrandMark({ compact = false, className }: BrandMarkProps) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        className={cn(
          "relative flex items-center justify-center border border-brand/35 bg-brand-soft",
          compact ? "h-9 w-9 rounded-xl" : "h-11 w-11 rounded-2xl"
        )}
        aria-hidden
      >
        <span className="absolute inset-[22%] rounded-full border-2 border-brand" />
        <span className="absolute h-2 w-2 rounded-full bg-brand" />
        <span className="absolute left-[28%] top-[22%] h-1.5 w-1.5 rounded-full bg-danger" />
      </div>
      <div className={cn(compact && "hidden min-[380px]:block")}>
        <p className="font-display text-[0.7rem] font-bold uppercase tracking-[0.22em] text-fg sm:text-xs">
          Capital Gang
        </p>
        {!compact && <p className="text-[0.7rem] text-muted">Clothing · Tattoo</p>}
      </div>
    </div>
  );
}
