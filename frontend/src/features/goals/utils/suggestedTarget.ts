import { formatGrouped } from "@/lib/formatNumber";
import type { WeightGoal, WeightGoals } from "@/types/goal";
import { goalRatePercentFromWeeklyChange } from "@/utils/nutritionCalculations";

import { CALORIES_PER_KG_FAT } from "../constants";

import { formatRatePercent } from "./goalUtilities";

/** Smaller gaps are noise in the measurement, not worth a prompt. */
export const SUGGESTION_MIN_DIFFERENCE = 100;

export interface TargetSuggestion {
  target: number;
  /** Measured expenditure as shown on the card, to the nearest 10. */
  measured: number;
  /** Daily kcal change for the goal: negative for lose, 0 for maintain. */
  change: number;
  weightGoal: WeightGoal;
  ratePercent: number;
  currentTarget: number;
  /** Set when measured + change fell below the BMR and the target stopped there. */
  bmrFloor?: number;
}

const roundToTen = (value: number) => Math.round(value / 10) * 10;

// Older goals stored the daily change with either sign, so the goal sets it.
function goalDailyChange(goals: WeightGoals): number {
  if (goals.weightGoal === "maintain") return 0;
  const size =
    Math.abs(goals.dailyChange) ||
    Math.round((Math.abs(goals.weeklyChange) * CALORIES_PER_KG_FAT) / 7);

  return goals.weightGoal === "lose" ? -size : size;
}

export function suggestTarget({
  measuredEstimate,
  goals,
  bmr,
}: {
  measuredEstimate: number;
  goals: WeightGoals;
  bmr: number;
}): TargetSuggestion | null {
  const measured = roundToTen(measuredEstimate);
  const change = goalDailyChange(goals);
  const raw = measured + change;
  const floored = bmr > 0 && raw < bmr;
  const target = floored ? bmr : raw;

  if (Math.abs(target - goals.calorieTarget) < SUGGESTION_MIN_DIFFERENCE) {
    return null;
  }

  return {
    target,
    measured,
    change,
    weightGoal: goals.weightGoal,
    ratePercent: goalRatePercentFromWeeklyChange(
      goals.weightGoal,
      goals.weeklyChange,
      goals.currentWeight,
    ),
    currentTarget: goals.calorieTarget,
    ...(floored ? { bmrFloor: bmr } : {}),
  };
}

export function describeSuggestion(suggestion: TargetSuggestion): string {
  const { target, measured, change, weightGoal, ratePercent, bmrFloor } =
    suggestion;
  const current = `Your current target is ${formatGrouped(suggestion.currentTarget)}.`;
  const head = `Suggested target ${formatGrouped(target)} kcal:`;

  if (weightGoal === "maintain") {
    return `${head} your measured ${formatGrouped(measured)}, to keep your weight steady. ${current}`;
  }

  const verb = weightGoal === "lose" ? "losing" : "gaining";
  const sum = `measured ${formatGrouped(measured)} ${change < 0 ? "minus" : "plus"} ${formatGrouped(Math.abs(change))} for ${verb} ${formatRatePercent(ratePercent)} a week`;

  if (bmrFloor !== undefined) {
    return `${head} ${sum} is ${formatGrouped(measured + change)}, below your BMR of ${formatGrouped(bmrFloor)}, so it stops at your BMR. ${current}`;
  }

  return `${head} ${sum}. ${current}`;
}

const DAY_MS = 86_400_000;

/** ISO 8601 week of a YYYY-MM-DD day, e.g. "2026-W42". */
export function isoWeek(dayKey: string): string {
  const date = new Date(`${dayKey}T00:00:00Z`);
  const weekday = date.getUTCDay() || 7;
  // The Thursday of this week decides which year the week belongs to.
  date.setUTCDate(date.getUTCDate() + 4 - weekday);
  const year = date.getUTCFullYear();
  const week = Math.ceil(
    ((date.getTime() - Date.UTC(year, 0, 1)) / DAY_MS + 1) / 7,
  );

  return `${year}-W${String(week).padStart(2, "0")}`;
}

const DISMISS_PREFIX = "macrotrackr:target-suggestion-dismissed:";

export const suggestionDismissKey = (userId: number, week: string) =>
  `${DISMISS_PREFIX}${userId}:${week}`;

export function clearSuggestionDismissals(): void {
  const storage = globalThis.localStorage;
  if (!storage) return;
  const keys = Array.from({ length: storage.length }, (_, index) =>
    storage.key(index),
  );
  for (const key of keys) {
    if (key?.startsWith(DISMISS_PREFIX)) storage.removeItem(key);
  }
}
