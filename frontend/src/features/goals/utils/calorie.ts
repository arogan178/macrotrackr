import type { WeightGoals } from "@/types/goal";

/**
 * Compute effective target calories following existing component logic:
 * - Prefer goals.calorieTarget if present
 * - Otherwise fall back to tdee (if finite), else 0
 */
export function computeEffectiveTargetCalories(
  tdee: number,
  goals?: WeightGoals,
): number {
  let effective = Number.isFinite(tdee) ? tdee : 0;
  if (goals?.calorieTarget) {
    effective = goals.calorieTarget;
  }
  if (!Number.isFinite(effective)) return 0;

  return effective;
}

/**
 * Compute daily adjustment (deficit positive, surplus negative) matching existing behavior:
 * - Prefer goals.dailyChange if non-zero
 * - If zero and both tdee and calorieTarget available, use tdee - calorieTarget
 * - Otherwise 0
 */
export function computeDailyAdjustment(
  tdee: number,
  goals?: WeightGoals,
): number {
  let daily = goals?.dailyChange ?? 0;
  if (daily === 0 && goals?.calorieTarget && tdee > 0) {
    daily = tdee - goals.calorieTarget;
  }

  return daily;
}

/**
 * Compute absolute daily difference for display with optional minimum for non-maintenance.
 * Mirrors WeightGoalStatus logic exactly.
 */
export function computeDailyDifferenceForDisplay(
  tdee: number,
  goals?: WeightGoals,
  enforceMinForNonMaintenance = true,
  minKcal = 50,
): number {
  const weightGoal = goals?.weightGoal ?? "maintain";
  const isMaintenance = weightGoal === "maintain";
  let dailyDiff = Math.abs(goals?.dailyChange ?? 0);
  if (dailyDiff === 0 && goals?.calorieTarget && tdee > 0) {
    dailyDiff = Math.abs(tdee - goals.calorieTarget);
  }
  if (!isMaintenance && enforceMinForNonMaintenance && dailyDiff < minKcal) {
    dailyDiff = minKcal;
  }

  return dailyDiff;
}