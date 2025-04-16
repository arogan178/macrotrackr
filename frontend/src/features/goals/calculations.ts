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
  startingWeight: number,
  targetWeight: number,
  dailyCalorieChange: number
): TimeToGoalCalculation {
  const weightDifference = Math.abs(startingWeight - targetWeight);
  const isWeightLoss = startingWeight > targetWeight;

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
 * @param startingWeight - Current weight in kg
 * @param targetWeight - Target weight in kg
 * @param targetWeeks - Desired number of weeks to reach goal
 * @returns Recommended daily calorie deficit/surplus (positive for weight loss, negative for gain)
 */
export function calculateRecommendedDeficit(
  startingWeight: number,
  targetWeight: number,
  targetWeeks: number = DEFAULT_TARGET_WEEKS
): number {
  if (!startingWeight || !targetWeight || targetWeeks <= 0) {
    return 0;
  }

  const weightDifference = Math.abs(startingWeight - targetWeight);
  const isWeightLoss = startingWeight > targetWeight;
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
 * Calculate weekly weight change based on weights
 */
export function calculateWeeklyChange(
  startingWeight: number,
  targetWeight: number
): number {
  const timeCalc = calculateTimeToGoal(startingWeight, targetWeight, 500); // Use default 500 calorie deficit/surplus
  return timeCalc.expectedWeightLossPerWeek;
}

/**
 * Calculate calorie target based on TDEE and weight goals
 */
export function calculateCalorieTarget(
  tdee: number,
  startingWeight: number,
  targetWeight: number
): number {
  if (startingWeight === targetWeight) {
    return tdee; // Maintenance
  }

  // For weight loss (deficit) or weight gain (surplus)
  return startingWeight > targetWeight ? tdee - 500 : tdee + 500;
}

/**
 * Calculate weeks to goal based on weights and calorie change
 */
export function calculateWeeksToGoal(
  startingWeight: number,
  targetWeight: number
): number {
  const timeCalc = calculateTimeToGoal(startingWeight, targetWeight, 500); // Use default 500 calorie deficit/surplus
  return timeCalc.weeksToGoal;
}

/**
 * Generate complete weight goal calculations based on user inputs
 * @param tdee - Total Daily Energy Expenditure
 * @param startingWeight - Current weight in kg
 * @param targetWeight - Target weight in kg
 * @param customCalorieIntake - Optional: User-specified daily calorie intake
 * @returns Complete weight goals with calculations
 */
export function generateWeightGoalCalculations(
  tdee: number,
  startingWeight: number,
  targetWeight: number,
  customCalorieIntake?: number
): Partial<WeightGoals> {
  // If custom calorie intake is provided, use it
  const calorieTarget =
    customCalorieIntake !== undefined
      ? customCalorieIntake
      : calculateCalorieTarget(tdee, startingWeight, targetWeight);

  const calorieDeficit = tdee - calorieTarget;
  const isWeightLoss = startingWeight > targetWeight;

  // For maintenance goals (same weight), set calculatedWeeks to 0
  if (startingWeight === targetWeight) {
    return {
      startingWeight,
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
    startingWeight,
    targetWeight,
    effectiveCalorieChange
  );

  // Calculate estimated completion date
  const targetDate = new Date();
  targetDate.setDate(targetDate.getDate() + weeksToGoal * 7);

  return {
    startingWeight,
    targetWeight,
    weightGoal:
      startingWeight > targetWeight
        ? "lose"
        : startingWeight < targetWeight
        ? "gain"
        : "maintain",
    calorieTarget,
    targetDate: targetDate.toISOString().split("T")[0],
    calculatedWeeks: weeksToGoal,
    weeklyChange: expectedWeightLossPerWeek,
    dailyChange: calorieDeficit,
  };
}
