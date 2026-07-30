"use client";

import { Loader2 } from "lucide-react";
import { cn } from "@/shared/lib/cn";
import type { AIAssetStatus, AIVersionJobStatus } from "../../domain/entities";
import { AI_ASSET_STATUS_LABELS } from "../../domain/entities";

const STATUS_STYLES: Record<AIAssetStatus, string> = {
  DRAFT: "bg-elevated text-muted",
  PROCESSING: "bg-brand-soft text-brand",
  READY: "bg-emerald-500/15 text-emerald-400",
  PUBLISHED: "bg-sky-500/15 text-sky-300",
  ARCHIVED: "bg-elevated text-subtle",
  ERROR: "bg-danger/15 text-danger",
};

export function ProcessingStatus({
  status,
  jobStatus,
  className,
}: {
  status: AIAssetStatus;
  jobStatus?: AIVersionJobStatus;
  className?: string;
}) {
  const busy = status === "PROCESSING" || jobStatus === "PROCESSING" || jobStatus === "PENDING";

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium uppercase tracking-wide",
        STATUS_STYLES[status],
        className
      )}
    >
      {busy && <Loader2 size={12} className="animate-spin" />}
      {AI_ASSET_STATUS_LABELS[status]}
    </span>
  );
}
