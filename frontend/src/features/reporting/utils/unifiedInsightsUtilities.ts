import { DURATIONS, EASINGS } from "@/components/utils/UiConstants";

/**
 * Local utilities for UnifiedInsights and its subcomponents.
 */

// This file's header claimed it used existing tokens only while holding a
// duration and a cubic-bezier that appeared nowhere else in the system. It
// reads them now.
export const TRANSITIONS = {
  duration: DURATIONS.base,
  ease: EASINGS.out,
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
  "rounded-card border border-border bg-surface p-6";

export const SECTION_HEADING_CLASSES =
  "text-lg font-semibold tracking-tight text-foreground/90";

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

export function getTextColorByScore(
  score: number,
  variant: "consistency" | "density" = "consistency",
): string {
  return getColorByScore(score, variant).replace("bg-", "text-");
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
