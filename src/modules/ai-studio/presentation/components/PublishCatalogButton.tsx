"use client";

import { Megaphone } from "lucide-react";
import { Button } from "@/shared/ui/components/Button";

export function PublishCatalogButton({
  count,
  isLoading,
  onClick,
  disabled,
}: {
  count: number;
  isLoading?: boolean;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      type="button"
      variant="primary"
      size="sm"
      isLoading={isLoading}
      disabled={disabled || count === 0}
      onClick={onClick}
      className="min-w-0"
    >
      <Megaphone size={16} />
      <span className="truncate">Publicar al catálogo{count > 0 ? ` (${count})` : ""}</span>
    </Button>
  );
}
