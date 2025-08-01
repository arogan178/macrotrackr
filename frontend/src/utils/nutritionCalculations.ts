import { CALORIES_PER_GRAM } from "@/utils/constants/nutrition";
import {
  CALORIES_PER_KG_FAT,
  DEFAULT_TARGET_WEEKS,
  MAX_WEEKLY_WEIGHT_LOSS,
  MIN_WEEKLY_WEIGHT_LOSS,
} from "@/features/goals/constants";
import type { MacroDailyTotals, MacroEntry } from "@/types/macro";
import type { ActivityLevel, Gender } from "@/types/user";

/**
 * Calorie helpers (raw math, no rounding by default)
 */
export function caloriesFromMacrosRaw(protein: number, carbs: number, fats: number): number {
  return protein * CALORIES_PER_GRAM.protein + carbs * CALORIES_PER_GRAM.carbs + fats * CALORIES_PER_GRAM.fats;
}

export function caloriesFromMacrosRounded(protein: number, carbs: number, fats: number): number {
  return Math.round(caloriesFromMacrosRaw(protein, carbs, fats));
}

export function caloriesFromEntryRaw(entry: MacroEntry): number {
  return caloriesFromMacrosRaw(entry.protein || 0, entry.carbs || 0, entry.fats || 0);
}

/**
 * Backwards-compatible names used around the app
 */
export const calculateCaloriesFromMacros = caloriesFromMacrosRaw;
export const calculateEntryCalories = (entry: MacroEntry) => caloriesFromEntryRaw(entry);

/**
 * Macro percentages and targets
 */
export function calculateCaloriePercentages(
  protein: number,
  carbs: number,
  fats: number,
) {
  const totalCalories = caloriesFromMacrosRounded(protein, carbs, fats);
  if (totalCalories === 0) {
    return { proteinPercent: 0, carbsPercent: 0, fatsPercent: 0 };
  }
  const proteinPercent = Math.round(((protein * CALORIES_PER_GRAM.protein) / totalCalories) * 100);
  const carbsPercent = Math.round(((carbs * CALORIES_PER_GRAM.carbs) / totalCalories) * 100);
  const fatsPercent = Math.round(((fats * CALORIES_PER_GRAM.fats) / totalCalories) * 100);
  return { proteinPercent, carbsPercent, fatsPercent };
}

export function calculateMacroTarget(
  totalCalories: number,
  proteinPercentage: number,
  carbsPercentage: number,
  fatsPercentage: number,
) {
  const proteinTarget = Math.round((totalCalories * (proteinPercentage / 100)) / CALORIES_PER_GRAM.protein);
  const carbsTarget = Math.round((totalCalories * (carbsPercentage / 100)) / CALORIES_PER_GRAM.carbs);
  const fatsTarget = Math.round((totalCalories * (fatsPercentage / 100)) / CALORIES_PER_GRAM.fats);
  return { proteinTarget, carbsTarget, fatsTarget };
}

/**
 * Daily totals
 */
export const DEFAULT_MACRO_TOTALS: MacroDailyTotals = { protein: 0, carbs: 0, fats: 0, calories: 0 };

export function calculateDailyTotals(entries: MacroEntry[]): MacroDailyTotals {
  if (!entries || entries.length === 0) {
    return DEFAULT_MACRO_TOTALS;
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
  activityLevelsMap: Record<number, { value: ActivityLevel; multiplier: number }>,
): number {
  let multiplier = activityLevelsMap[1]?.multiplier ?? 1;
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
export interface TimeToGoalCalculation {
  weeksToGoal: number;
  dailyCalorieDeficit: number;
  expectedWeightLossPerWeek: number;
}

export function calculateTimeToGoal(
  startingWeight: number,
  targetWeight: number,
  dailyCalorieChange: number,
): TimeToGoalCalculation {
  const weightDifference = Math.abs(startingWeight - targetWeight);
  const isWeightLoss = startingWeight > targetWeight;

  if (dailyCalorieChange === 0) {
    return {
      weeksToGoal: Infinity,
      dailyCalorieDeficit: 0,
      expectedWeightLossPerWeek: 0,
    };
  }

  const weeklyCalorieChange = dailyCalorieChange * 7;
  const expectedWeightChangePerWeek = weeklyCalorieChange / CALORIES_PER_KG_FAT;
  const weeksToGoal =
    expectedWeightChangePerWeek === 0 ? Infinity : weightDifference / Math.abs(expectedWeightChangePerWeek);

  return {
    weeksToGoal: Math.ceil(weeksToGoal),
    dailyCalorieDeficit: isWeightLoss ? dailyCalorieChange : -dailyCalorieChange,
    expectedWeightLossPerWeek: isWeightLoss ? expectedWeightChangePerWeek : -expectedWeightChangePerWeek,
  };
}

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
  const safeWeeklyLoss = Math.min(Math.max(weeklyWeightLoss, MIN_WEEKLY_WEIGHT_LOSS), MAX_WEEKLY_WEIGHT_LOSS);
  const dailyChange = (safeWeeklyLoss * CALORIES_PER_KG_FAT) / 7;
  return Math.round(isWeightLoss ? dailyChange : -dailyChange);
}

export function calculateWeeklyChange(
  startingWeight: number,
  targetWeight: number,
): number {
  const timeCalc = calculateTimeToGoal(startingWeight, targetWeight, 500);
  return timeCalc.expectedWeightLossPerWeek;
}

export function calculateCalorieTarget(
  tdee: number,
  startingWeight: number,
  targetWeight: number,
): number {
  if (startingWeight === targetWeight) {
    return tdee;
  }
  return startingWeight > targetWeight ? tdee - 500 : tdee + 300;
}

export function calculateWeeksToGoal(
  startingWeight: number,
  targetWeight: number,
): number {
  const timeCalc = calculateTimeToGoal(startingWeight, targetWeight, 500);
  return timeCalc.weeksToGoal;
}

export function generateWeightGoalCalculations(
  tdee: number,
  startingWeight: number,
  targetWeight: number,
  customCalorieIntake?: number,
) {
  let calorieTarget = customCalorieIntake ?? calculateCalorieTarget(tdee, startingWeight, targetWeight);

  const weightGoal =
    startingWeight > targetWeight ? "lose" : startingWeight < targetWeight ? "gain" : "maintain";

  if (weightGoal !== "maintain") {
    let difference = calorieTarget - tdee;
    if (Math.abs(difference) < 50) {
      calorieTarget = difference >= 0 ? tdee + 50 : tdee - 50;
      difference = calorieTarget - tdee;
    }
  }

  const calorieDifference = calorieTarget - tdee;

  if (weightGoal === "maintain") {
    const targetDate = new Date();
    targetDate.setDate(targetDate.getDate() + 7);
    return {
      startingWeight,
      targetWeight,
      weightGoal: "maintain" as const,
      calorieTarget,
      targetDate: targetDate.toISOString().split("T")[0],
      calculatedWeeks: 1,
      weeklyChange: 0,
      dailyChange: calorieDifference,
    };
  }

  const effectiveCalorieChange = weightGoal === "lose" ? -calorieDifference : calorieDifference;

  if (effectiveCalorieChange <= 0) {
    const fallbackDate = new Date();
    fallbackDate.setDate(fallbackDate.getDate() + 365);
    return {
      startingWeight,
      targetWeight,
      weightGoal,
      calorieTarget,
      targetDate: fallbackDate.toISOString().split("T")[0],
      calculatedWeeks: 52,
      weeklyChange: 0,
      dailyChange: calorieDifference,
    };
  }

  const { weeksToGoal, expectedWeightLossPerWeek } = calculateTimeToGoal(
    startingWeight,
    targetWeight,
    effectiveCalorieChange,
  );

  const finalWeeks = isFinite(weeksToGoal) ? weeksToGoal : 52;
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + finalWeeks * 7);

  return {
    startingWeight,
    targetWeight,
    weightGoal,
    calorieTarget,
    targetDate: targetDate.toISOString().split("T")[0],
    calculatedWeeks: finalWeeks,
    weeklyChange: isFinite(expectedWeightLossPerWeek) ? expectedWeightLossPerWeek : 0,
    dailyChange: calorieDifference,
  };
}