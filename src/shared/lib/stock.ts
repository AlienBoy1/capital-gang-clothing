/** Stock level labels driven by admin-configurable thresholds. */

export type StockLevel = "high" | "medium" | "low" | "out";

export interface StockThresholds {
  /** stock >= high → mucho */
  high: number;
  /** stock >= medium (and < high) → más o menos; below → poco */
  medium: number;
}

export const DEFAULT_STOCK_THRESHOLDS: StockThresholds = {
  high: 15,
  medium: 5,
};

export function resolveStockLevel(stock: number, thresholds: StockThresholds = DEFAULT_STOCK_THRESHOLDS): StockLevel {
  if (stock <= 0) return "out";
  if (stock >= thresholds.high) return "high";
  if (stock >= thresholds.medium) return "medium";
  return "low";
}

export function stockLevelLabel(level: StockLevel): string {
  switch (level) {
    case "high":
      return "Mucho stock";
    case "medium":
      return "Stock medio";
    case "low":
      return "Poco stock";
    case "out":
      return "Agotado";
  }
}

export function stockLevelTone(level: StockLevel): string {
  switch (level) {
    case "high":
      return "bg-emerald-500/15 text-emerald-400 border-emerald-500/30";
    case "medium":
      return "bg-amber-500/15 text-amber-400 border-amber-500/30";
    case "low":
      return "bg-orange-500/15 text-orange-400 border-orange-500/30";
    case "out":
      return "bg-danger/15 text-danger border-danger/30";
  }
}
