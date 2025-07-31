// src/features/goals/calculations.ts

import type { WeightGoals } from "@/types/goal";

import {
  CALORIES_PER_KG_FAT,
  DEFAULT_TARGET_WEEKS,
  MAX_WEEKLY_WEIGHT_LOSS,
  MIN_WEEKLY_WEIGHT_LOSS,
} from "./constants";
import type { TimeToGoalCalculation } from "./types";

/**
 * Calculate the time to reach the goal weight based on current and target weights
 * and daily calorie deficit.
 */
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
    expectedWeightChangePerWeek === 0
      ? Infinity
      : weightDifference / Math.abs(expectedWeightChangePerWeek);

  return {
    weeksToGoal: Math.ceil(weeksToGoal),
    dailyCalorieDeficit: isWeightLoss
      ? dailyCalorieChange
      : -dailyCalorieChange,
    expectedWeightLossPerWeek: isWeightLoss
      ? expectedWeightChangePerWeek
      : -expectedWeightChangePerWeek,
  };
}

/**
 * Calculate the recommended daily calorie deficit based on weight difference and target timeframe.
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

/**
 * Calculate weekly weight change based on weights.
 */
export function calculateWeeklyChange(
  startingWeight: number,
  targetWeight: number,
): number {
  const timeCalc = calculateTimeToGoal(startingWeight, targetWeight, 500);
  return timeCalc.expectedWeightLossPerWeek;
}

/**
 * Calculate calorie target based on TDEE and weight goals.
 */
export function calculateCalorieTarget(
  tdee: number,
  startingWeight: number,
  targetWeight: number,
): number {
  if (startingWeight === targetWeight) {
    return tdee; // Maintenance
  }
  return startingWeight > targetWeight ? tdee - 500 : tdee + 300;
}

/**
 * Calculate weeks to goal based on weights and calorie change.
 */
export function calculateWeeksToGoal(
  startingWeight: number,
  targetWeight: number,
): number {
  const timeCalc = calculateTimeToGoal(startingWeight, targetWeight, 500);
  return timeCalc.weeksToGoal;
}

/**
 * Generate complete weight goal calculations based on user inputs.
 */
export function generateWeightGoalCalculations(
  tdee: number,
  startingWeight: number,
  targetWeight: number,
  customCalorieIntake?: number,
): Partial<WeightGoals> {
  let calorieTarget =
    customCalorieIntake ??
    calculateCalorieTarget(tdee, startingWeight, targetWeight);

  const weightGoal =
    startingWeight > targetWeight
      ? "lose"
      : startingWeight < targetWeight
        ? "gain"
        : "maintain";

  // Enforce a minimum 50 kcal surplus/deficit if a custom intake is provided or if difference is 0
  if (weightGoal !== "maintain") {
    let difference = calorieTarget - tdee;
    if (Math.abs(difference) < 50) {
      // If difference is 0 or too small, adjust to minimum allowed
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
      weightGoal: "maintain",
      calorieTarget,
      targetDate: targetDate.toISOString().split("T")[0],
      calculatedWeeks: 1,
      weeklyChange: 0,
      dailyChange: calorieDifference,
    };
  }

  const effectiveCalorieChange =
    weightGoal === "lose" ? -calorieDifference : calorieDifference;

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
    weeklyChange: isFinite(expectedWeightLossPerWeek)
      ? expectedWeightLossPerWeek
      : 0,
    dailyChange: calorieDifference,
  };
}
