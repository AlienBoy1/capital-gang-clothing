"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export function BackButton() {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.back()}
      className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-2 text-sm text-muted transition hover:bg-elevated hover:text-fg"
    >
      <ArrowLeft size={16} />
      Volver
    </button>
  );
}
