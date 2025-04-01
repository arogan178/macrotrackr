import {
  CALORIES_PER_KG_FAT,
  DEFAULT_TARGET_WEEKS,
  MIN_WEEKLY_WEIGHT_LOSS,
  MAX_WEEKLY_WEIGHT_LOSS,
} from "./constants";
import type { TimeToGoalCalculation, WeightGoals } from "./types";

/**
 * Calculate the time to reach the goal weight based on current and target weights
 * and daily calorie deficit
 */
export function calculateTimeToGoal(
  currentWeight: number,
  targetWeight: number,
  dailyCalorieChange: number
): TimeToGoalCalculation {
  const weightDifference = Math.abs(currentWeight - targetWeight);
  const isWeightLoss = currentWeight > targetWeight;

  // Calculate weekly deficit/surplus and expected weight change - use the provided value directly
  const weeklyCalorieChange = dailyCalorieChange * 7;
  const expectedWeightChangePerWeek = weeklyCalorieChange / CALORIES_PER_KG_FAT;

  // Calculate weeks to goal - same formula works for both loss and gain
  const weeksToGoal = weightDifference / expectedWeightChangePerWeek;

  return {
    weeksToGoal: Math.ceil(weeksToGoal),
    dailyCalorieDeficit: isWeightLoss
      ? dailyCalorieChange
      : -dailyCalorieChange, // Negative for surplus (weight gain)
    expectedWeightLossPerWeek: isWeightLoss
      ? expectedWeightChangePerWeek
      : -expectedWeightChangePerWeek, // Negative for weight gain
  };
}

/**
 * Calculate the recommended daily calorie deficit based on weight difference and target timeframe
 * @param currentWeight - Current weight in kg
 * @param targetWeight - Target weight in kg
 * @param targetWeeks - Desired number of weeks to reach goal
 * @returns Recommended daily calorie deficit/surplus (positive for weight loss, negative for gain)
 */
export function calculateRecommendedDeficit(
  currentWeight: number,
  targetWeight: number,
  targetWeeks: number = DEFAULT_TARGET_WEEKS
): number {
  if (!currentWeight || !targetWeight || targetWeeks <= 0) {
    return 0;
  }

  const weightDifference = Math.abs(currentWeight - targetWeight);
  const isWeightLoss = currentWeight > targetWeight;
  const weeklyWeightLoss = weightDifference / targetWeeks;

  // Ensure weekly weight loss is within safe limits
  const safeWeeklyLoss = Math.min(
    Math.max(weeklyWeightLoss, MIN_WEEKLY_WEIGHT_LOSS),
    MAX_WEEKLY_WEIGHT_LOSS
  );

  // Calculate daily calorie deficit needed
  const dailyChange = (safeWeeklyLoss * CALORIES_PER_KG_FAT) / 7;

  // Return positive deficit for weight loss, negative for weight gain
  return Math.round(isWeightLoss ? dailyChange : -dailyChange);
}

/**
 * Calculate calorie target based on TDEE and weight goal
 * @param tdee - Total Daily Energy Expenditure (maintenance calories)
 * @param currentWeight - Current weight in kg
 * @param targetWeight - Target weight in kg
 * @param targetWeeks - Optional: Desired timeframe in weeks (defaults to 12)
 * @returns Daily calorie target to achieve goal
 */
export function calculateCalorieTarget(
  tdee: number,
  currentWeight: number,
  targetWeight: number,
  targetWeeks?: number
): number {
  // Validate inputs
  if (!tdee || tdee < 1000 || !currentWeight || !targetWeight) {
    return tdee; // Return original TDEE if invalid inputs
  }

  const recommendedDeficit = calculateRecommendedDeficit(
    currentWeight,
    targetWeight,
    targetWeeks || DEFAULT_TARGET_WEEKS
  );

  const adjustedIntake = tdee - recommendedDeficit;

  // Ensure the adjusted intake isn't dangerously low
  return Math.max(Math.round(adjustedIntake), 1200);
}

/**
 * Generate complete weight goal calculations based on user inputs
 * @param tdee - Total Daily Energy Expenditure
 * @param currentWeight - Current weight in kg
 * @param targetWeight - Target weight in kg
 * @param customCalorieIntake - Optional: User-specified daily calorie intake
 * @returns Complete weight goals with calculations
 */
export function generateWeightGoalCalculations(
  tdee: number,
  currentWeight: number,
  targetWeight: number,
  customCalorieIntake?: number
): Partial<WeightGoals> {
  // If custom calorie intake is provided, use it
  const calorieTarget =
    customCalorieIntake !== undefined
      ? customCalorieIntake
      : calculateCalorieTarget(tdee, currentWeight, targetWeight);

  const calorieDeficit = tdee - calorieTarget;
  const isWeightLoss = currentWeight > targetWeight;

  // For maintenance goals (same weight), set calculatedWeeks to 0
  if (currentWeight === targetWeight) {
    return {
      currentWeight,
      targetWeight,
      weightGoal: "maintain",
      calorieTarget,
      targetDate: new Date().toISOString().split("T")[0], // Today's date
      calculatedWeeks: 0,
      weeklyChange: 0,
      dailyChange: calorieDeficit,
    };
  }

  // Calculate the effective calorie change (deficit for weight loss, surplus for weight gain)
  const effectiveCalorieChange = Math.abs(calorieDeficit);

  // Get time to goal calculations
  const { weeksToGoal, expectedWeightLossPerWeek } = calculateTimeToGoal(
    currentWeight,
    targetWeight,
    effectiveCalorieChange
  );

  // Calculate estimated completion date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksToGoal * 7);

  return {
    currentWeight,
    targetWeight,
    weightGoal:
      currentWeight > targetWeight
        ? "lose"
        : currentWeight < targetWeight
        ? "gain"
        : "maintain",
    calorieTarget,
    targetDate: targetDate.toISOString().split("T")[0],
    calculatedWeeks: weeksToGoal,
    weeklyChange: expectedWeightLossPerWeek,
    dailyChange: calorieDeficit,
  };
}
