import {
  type DesignTokens,
  resolveTokens,
  TOKEN_FALLBACK,
} from "@/lib/designTokens";
import { formatGrouped } from "@/lib/formatNumber";

/**
 * One model for the share snapshot, read by both renderers.
 *
 * The preview and the exported PNG were two independent implementations of the
 * same card, so they drifted: the preview clamped every macro to 100% while the
 * canvas printed the true 113%, the canvas carried its own palette (fats came
 * out rose where the app shows yellow), and each had copy the other did not.
 * Numbers, colours and wording are decided here once; a renderer only draws.
 */

export interface MacroSnapshotData {
  title?: string;
  dateLabel?: string;
  calories: number;
  calorieTarget: number;
  protein: number;
  proteinTarget: number;
  carbs: number;
  carbsTarget: number;
  fats: number;
  fatsTarget: number;
  streakDays?: number;
  complianceScore?: number;
  badgeLabel?: string;
  userName?: string;
}

export type MacroKey = "protein" | "carbs" | "fats";

export interface SnapshotMacroRow {
  key: MacroKey;
  label: string;
  grams: number;
  targetGrams: number;
  /** The real figure, which may exceed 100. Never clamped for display. */
  percentOfTarget: number;
  /** Bar fill only. A bar cannot be longer than its track; the number can. */
  barPercent: number;
  calories: number;
  /** Share of the day's macro calories. */
  energyShare: number;
}

export interface SnapshotModel {
  title: string;
  dateLabel: string;
  badge: string;
  calories: number;
  calorieTarget: number;
  caloriePercent: number;
  calorieBarPercent: number;
  /** Already phrased, because both renderers were phrasing it differently. */
  calorieRemainder: string;
  macros: SnapshotMacroRow[];
  totalMacroCalories: number;
  shareText: string;
  fileStem: string;
}

const DEFAULT_TARGETS = {
  calories: 2000,
  protein: 150,
  carbs: 200,
  fats: 65,
} as const;

const CALORIES_PER_GRAM: Record<MacroKey, number> = {
  protein: 4,
  carbs: 4,
  fats: 9,
};

const MACRO_LABEL: Record<MacroKey, string> = {
  protein: "Protein",
  carbs: "Carbs",
  fats: "Fats",
};

const clampBar = (percent: number) => Math.max(0, Math.min(100, percent));

const share = (part: number, whole: number) =>
  whole > 0 ? Math.round((part / whole) * 100) : 0;

/**
 * Slugifies a date for a filename. `dateLabel` is display text, so it can
 * contain commas, slashes and spaces.
 */
function toFileStem(dateLabel: string): string {
  const slug = dateLabel
    .toLowerCase()
    .replace(/[^\da-z]+/g, "-")
    .replace(/^-|-$/g, "");

  return slug || "snapshot";
}

export function buildSnapshotModel(data: MacroSnapshotData): SnapshotModel {
  const calories = Math.round(data.calories);
  const calorieTarget =
    Math.round(data.calorieTarget) || DEFAULT_TARGETS.calories;

  const grams: Record<MacroKey, number> = {
    protein: Math.round(data.protein),
    carbs: Math.round(data.carbs),
    fats: Math.round(data.fats),
  };
  const targets: Record<MacroKey, number> = {
    protein: Math.round(data.proteinTarget) || DEFAULT_TARGETS.protein,
    carbs: Math.round(data.carbsTarget) || DEFAULT_TARGETS.carbs,
    fats: Math.round(data.fatsTarget) || DEFAULT_TARGETS.fats,
  };

  const keys: MacroKey[] = ["protein", "carbs", "fats"];
  const calorieByMacro = keys.map((key) => grams[key] * CALORIES_PER_GRAM[key]);
  const totalMacroCalories = calorieByMacro.reduce((sum, n) => sum + n, 0);

  const macros: SnapshotMacroRow[] = keys.map((key, index) => {
    const macroCalories = calorieByMacro[index];
    const percentOfTarget = share(grams[key], targets[key]);

    return {
      key,
      label: MACRO_LABEL[key],
      grams: grams[key],
      targetGrams: targets[key],
      percentOfTarget,
      barPercent: clampBar(percentOfTarget),
      calories: macroCalories,
      energyShare: share(macroCalories, totalMacroCalories),
    };
  });

  // The three shares are rounded independently, so they can sum to 99 or 101.
  // The strip is drawn from them, so the last one absorbs the difference and
  // the legend always adds up to 100.
  if (totalMacroCalories > 0) {
    const drift =
      100 - macros.reduce((sum, macro) => sum + macro.energyShare, 0);
    macros[2].energyShare = Math.max(0, macros[2].energyShare + drift);
  }

  const caloriePercent = share(calories, calorieTarget);
  const remaining = calorieTarget - calories;

  const badge =
    data.badgeLabel ??
    (data.streakDays && data.streakDays > 0
      ? `${data.streakDays}-day streak`
      : data.complianceScore
        ? `${data.complianceScore}% compliance`
        : `${caloriePercent}% of target`);

  const dateLabel = data.dateLabel ?? "Today";

  return {
    title: data.title ?? "Daily macros",
    dateLabel,
    badge,
    calories,
    calorieTarget,
    caloriePercent,
    calorieBarPercent: clampBar(caloriePercent),
    calorieRemainder:
      remaining >= 0
        ? `${formatGrouped(remaining)} kcal left`
        : `${formatGrouped(Math.abs(remaining))} kcal over`,
    macros,
    totalMacroCalories,
    shareText: `${formatGrouped(calories)} of ${formatGrouped(calorieTarget)} kcal — ${macros
      .map((macro) => `${macro.label.toLowerCase()} ${macro.grams}g`)
      .join(", ")}.`,
    fileStem: toFileStem(dateLabel),
  };
}

export type SnapshotPalette = DesignTokens;

/**
 * The app's own tokens, so the export cannot drift from the screen. Previously
 * transcribed into the canvas by hand, which is how it shipped a rose fats
 * against the app's yellow.
 */
export const resolveSnapshotPalette = resolveTokens;
export const SNAPSHOT_PALETTE_FALLBACK = TOKEN_FALLBACK;
