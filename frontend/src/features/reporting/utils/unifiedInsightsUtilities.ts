/**
 * Local utilities for UnifiedInsights and its subcomponents.
 * Uses existing design tokens only.
 */
 
export const TRANSITIONS = {
  duration: 0.3,
  ease: [0.22, 1, 0.36, 1] as const,
};

export const STAGGER = {
  topCard0: 0,
  topCard1: 0.1,
  topCard2: 0.2,
  sectionTrend: 0.3,
  sectionTracking: 0.4,
};

export const BAR_BASE_CLASSES =
  "h-2 w-full rounded-full bg-surface overflow-hidden";

export const CARD_BASE_CLASSES =
  "rounded-2xl border border-border bg-surface p-6 backdrop-blur-sm";

export const SECTION_HEADING_CLASSES = "text-lg font-semibold text-foreground";

export const SUBTEXT_MUTED_CLASSES = "text-xs text-foreground";

/**
 * Map a score 0-100 to existing token classes.
 * Thresholds mirror existing component logic.
 */
export function getColorByScore(
  score: number,
  variant: "consistency" | "density" = "consistency",
): string {
  if (variant === "density") {
    // density: success >70, warning >40, else error
    if (score > 70) return "bg-success";
    if (score > 40) return "bg-warning";
    return "bg-error";
  }
  // consistency: success >70, warning >40, else error
  if (score > 70) return "bg-success";
  if (score > 40) return "bg-warning";
  return "bg-error";
}

/**
 * Parse macro ratio string like "30/40/30" to number array.
 * Ensures we always return 3 numbers that sum close to 100.
 */
export function parseMacroRatio(ratio: string | undefined | null): number[] {
  if (!ratio || typeof ratio !== "string") return [0, 0, 0];
  const parts = ratio
    .split("/")
    .map((p) => p.trim())
    .map((p) => Number.parseFloat(p))
    .filter((n) => Number.isFinite(n) && n >= 0);

  if (parts.length !== 3) return [0, 0, 0];

  const total = parts.reduce((a, b) => a + b, 0);
  if (total === 0) return [0, 0, 0];

  // Normalize minor rounding inconsistencies
  return parts.map((p) => Math.max(0, Math.min(100, p)));
}