import { cn } from "@/shared/lib/cn";

interface StatCardProps {
  label: string;
  value: number;
  accent?: boolean;
}

export function StatCard({ label, value, accent }: StatCardProps) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-5">
      <p className="text-xs uppercase tracking-[0.2em] text-subtle">{label}</p>
      <p className={cn("mt-2 font-display text-3xl font-semibold", accent ? "text-brand" : "text-fg")}>
        {value}
      </p>
    </div>
  );
}
