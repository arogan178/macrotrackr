import {
  CALORIES_PER_KG_FAT,
  DEFAULT_TARGET_WEEKS,
  GOAL_RATE_PERCENT,
  GOAL_RATE_STEP,
  MAX_WEEKLY_WEIGHT_LOSS,
  MIN_WEEKLY_WEIGHT_LOSS,
} from "@/features/goals/constants";
import type { ActivityLevel, Gender } from "@/types/activity";
import type { WeightGoal } from "@/types/goal";
import type { MacroDailyTotals, MacroEntry } from "@/types/macro";
import {
  CALORIES_PER_GRAM,
  DEFAULT_MACRO_TOTALS,
} from "@/utils/constants/nutrition";

/**
 * Calorie helpers (raw math, no rounding by default)
 */
export function caloriesFromMacrosRaw(
  protein: number,
  carbs: number,
  fats: number,
): number {
  return (
    protein * CALORIES_PER_GRAM.protein +
    carbs * CALORIES_PER_GRAM.carbs +
    fats * CALORIES_PER_GRAM.fats
  );
}

export function caloriesFromMacrosRounded(
  protein: number,
  carbs: number,
  fats: number,
): number {
  return Math.round(caloriesFromMacrosRaw(protein, carbs, fats));
}

// Per-macro calorie helpers (rounded for UI usage)
export function calculateProteinCalories(protein: number): number {
  return Math.round(protein * CALORIES_PER_GRAM.protein);
}
export function calculateCarbsCalories(carbs: number): number {
  return Math.round(carbs * CALORIES_PER_GRAM.carbs);
}
export function calculateFatsCalories(fats: number): number {
  return Math.round(fats * CALORIES_PER_GRAM.fats);
}

export function caloriesFromEntryRaw(entry: MacroEntry): number {
  return caloriesFromMacrosRaw(
    entry.protein || 0,
    entry.carbs || 0,
    entry.fats || 0,
  );
}

/**
 * Backwards-compatible names used around the app
 */
export const calculateCaloriesFromMacros = caloriesFromMacrosRaw;
export const calculateEntryCalories = (entry: MacroEntry) =>
  caloriesFromEntryRaw(entry);

/**
 * Macro percentages and targets
 */
export function calculateCaloriePercentages(
  protein: number,
  carbs: number,
  fats: number,
) {
  const totalCalories = caloriesFromMacrosRaw(protein, carbs, fats);
  if (totalCalories === 0) {
    return { proteinPercent: 0, carbsPercent: 0, fatsPercent: 0 };
  }
  const proteinPercent = Math.round(
    ((protein * CALORIES_PER_GRAM.protein) / totalCalories) * 100,
  );
  const carbsPercent = Math.round(
    ((carbs * CALORIES_PER_GRAM.carbs) / totalCalories) * 100,
  );
  const fatsPercent = Math.round(
    ((fats * CALORIES_PER_GRAM.fats) / totalCalories) * 100,
  );

  return { proteinPercent, carbsPercent, fatsPercent };
}

export function calculateMacroTarget(
  totalCalories: number,
  proteinPercentage: number,
  carbsPercentage: number,
  fatsPercentage: number,
) {
  const proteinTarget = Math.round(
    (totalCalories * (proteinPercentage / 100)) / CALORIES_PER_GRAM.protein,
  );
  const carbsTarget = Math.round(
    (totalCalories * (carbsPercentage / 100)) / CALORIES_PER_GRAM.carbs,
  );
  const fatsTarget = Math.round(
    (totalCalories * (fatsPercentage / 100)) / CALORIES_PER_GRAM.fats,
  );

  return { proteinTarget, carbsTarget, fatsTarget };
}

/**
 * Daily totals
 */
export function calculateDailyTotals(entries: MacroEntry[]): MacroDailyTotals {
  if (entries.length === 0) {
    return { ...DEFAULT_MACRO_TOTALS };
  }
  const totals: MacroDailyTotals = { ...DEFAULT_MACRO_TOTALS };
  for (const entry of entries) {
    totals.protein += entry.protein || 0;
    totals.carbs += entry.carbs || 0;
    totals.fats += entry.fats || 0;
    totals.calories += caloriesFromEntryRaw(entry);
  }

  return {
    protein: Math.round(totals.protein),
    carbs: Math.round(totals.carbs),
    fats: Math.round(totals.fats),
    calories: Math.round(totals.calories),
  };
}

// Backwards-compatible alias used across feature modules
export const calculateDailyTotalsFromEntries = calculateDailyTotals;

/**
 * BMR/TDEE
 */
function calculateBMRValue(
  weight: number,
  height: number,
  age: number,
  isMale: boolean,
): number {
  if (!weight || !height || !age || weight <= 0 || height <= 0 || age <= 0) {
    return 0;
  }
  const safeWeight = Math.max(30, Math.min(300, weight));
  const safeHeight = Math.max(100, Math.min(250, height));
  const safeAge = Math.min(120, Math.max(1, age));
  const baseCalculation = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge;
  const bmr = isMale ? baseCalculation + 5 : baseCalculation - 161;

  return Math.max(500, bmr);
}

export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: Gender,
): number {
  return Math.round(calculateBMRValue(weight, height, age, gender === "male"));
}

function calculateTDEEValue(bmr: number, activityMultiplier: number): number {
  if (!bmr) return 0;

  return Math.round(bmr * activityMultiplier);
}

export function calculateTDEE(bmr: number, activityMultiplier: number): number {
  return calculateTDEEValue(bmr, activityMultiplier);
}

export function calculateTDEEByActivityLevel(
  bmr: number,
  activityLevel: ActivityLevel,
  activityLevelsMap: Record<
    number,
    { value: ActivityLevel; multiplier: number }
  >,
): number {
  let multiplier = activityLevelsMap[1].multiplier;
  for (const level of Object.values(activityLevelsMap)) {
    if (level.value === activityLevel) {
      multiplier = level.multiplier;
      break;
    }
  }

  return calculateTDEEValue(bmr, multiplier);
}

/**
 * Goals math
 */
export function calculateRecommendedDeficit(
  startingWeight: number,
  targetWeight: number,
  targetWeeks: number = DEFAULT_TARGET_WEEKS,
): number {
  if (!startingWeight || !targetWeight || targetWeeks <= 0) {
    return 0;
  }
  const weightDifference = Math.abs(startingWeight - targetWeight);
  const isWeightLoss = startingWeight > targetWeight;
  const weeklyWeightLoss = weightDifference / targetWeeks;
  const safeWeeklyLoss = Math.min(
    Math.max(weeklyWeightLoss, MIN_WEEKLY_WEIGHT_LOSS),
    MAX_WEEKLY_WEIGHT_LOSS,
  );
  const dailyChange = (safeWeeklyLoss * CALORIES_PER_KG_FAT) / 7;

  return Math.round(isWeightLoss ? dailyChange : -dailyChange);
}

type GoalDirection = Exclude<WeightGoal, "maintain">;

export function clampGoalRatePercent(
  weightGoal: GoalDirection,
  percent: number,
): number {
  const { min, max } = GOAL_RATE_PERCENT[weightGoal];
  const stepped = Math.round(percent / GOAL_RATE_STEP) * GOAL_RATE_STEP;

  return Number(Math.min(max, Math.max(min, stepped)).toFixed(2));
}

// Weekly change in kg (negative when losing) and the daily calorie change that
// produces it, from a rate in % of body weight per week.
export function calculateGoalRate(
  weightKg: number,
  weightGoal: WeightGoal,
  percent: number,
): { weeklyChange: number; dailyCalorieChange: number } {
  if (weightGoal === "maintain" || !weightKg) {
    return { weeklyChange: 0, dailyCalorieChange: 0 };
  }
  const direction = weightGoal === "lose" ? -1 : 1;
  const weeklyChange = (direction * weightKg * percent) / 100;

  return {
    weeklyChange,
    dailyCalorieChange: Math.round((weeklyChange * CALORIES_PER_KG_FAT) / 7),
  };
}

// Stored goals keep kg/week, signed either way by older versions, so the
// percent is read back from its size against the current weight.
export function goalRatePercentFromWeeklyChange(
  weightGoal: WeightGoal,
  weeklyChangeKg: number | undefined,
  weightKg: number | undefined,
): number {
  if (weightGoal === "maintain") return 0;
  if (!weeklyChangeKg || !weightKg) {
    return GOAL_RATE_PERCENT[weightGoal].default;
  }

  return clampGoalRatePercent(
    weightGoal,
    (Math.abs(weeklyChangeKg) / weightKg) * 100,
  );
}

export function generateWeightGoalCalculations(
  tdee: number,
  startingWeight: number,
  targetWeight: number,
  ratePercent?: number,
  currentWeight: number = startingWeight,
) {
  const weightGoal: WeightGoal =
    startingWeight > targetWeight
      ? "lose"
      : startingWeight < targetWeight
        ? "gain"
        : "maintain";

  if (weightGoal === "maintain") {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);

    return {
      startingWeight,
      targetWeight,
      weightGoal: "maintain" as const,
      ratePercent: 0,
      calorieTarget: tdee,
      targetDate: targetDate.toISOString().split("T")[0],
      calculatedWeeks: 1,
      weeklyChange: 0,
      dailyChange: 0,
    };
  }

  const percent = clampGoalRatePercent(
    weightGoal,
    ratePercent ?? GOAL_RATE_PERCENT[weightGoal].default,
  );
  const { weeklyChange, dailyCalorieChange } = calculateGoalRate(
    currentWeight,
    weightGoal,
    percent,
  );
  const weeksToGoal =
    weeklyChange === 0
      ? 52
      : Math.ceil(
          Math.abs(targetWeight - startingWeight) / Math.abs(weeklyChange),
        );
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksToGoal * 7);

  return {
    startingWeight,
    targetWeight,
    weightGoal,
    ratePercent: percent,
    calorieTarget: tdee + dailyCalorieChange,
    targetDate: targetDate.toISOString().split("T")[0],
    calculatedWeeks: weeksToGoal,
    weeklyChange,
    dailyChange: dailyCalorieChange,
  };
}
