import type { TimeToGoalCalculation, WeightGoals } from "./types";

// Constants for weight and calorie calculations
const CALORIES_PER_KG_FAT = 7700; // Approximately 7700 calories per kg of body fat
const MIN_SAFE_DAILY_DEFICIT = 500; // Minimum safe daily calorie deficit
const MAX_SAFE_DAILY_DEFICIT = 1000; // Maximum safe daily calorie deficit
const MIN_WEEKLY_WEIGHT_LOSS = 0.5; // Minimum recommended weight loss per week (kg)
const MAX_WEEKLY_WEIGHT_LOSS = 1.0; // Maximum recommended weight loss per week (kg)
const DEFAULT_TARGET_WEEKS = 12; // Default timeframe for goal calculations

/**
 * Calculate the time to reach the goal weight based on current and target weights
 * and daily calorie deficit
 */
export function calculateTimeToGoal(
  currentWeight: number,
  targetWeight: number,
  dailyCalorieDeficit: number
): TimeToGoalCalculation {
  const weightDifference = Math.abs(currentWeight - targetWeight);
  const isWeightLoss = currentWeight > targetWeight;

  // Ensure daily deficit is within safe limits
  const adjustedDailyDeficit = Math.min(
    Math.max(dailyCalorieDeficit, MIN_SAFE_DAILY_DEFICIT),
    MAX_SAFE_DAILY_DEFICIT
  );

  // Calculate weekly deficit and expected weight change
  const weeklyCalorieDeficit = adjustedDailyDeficit * 7;
  const expectedWeightLossPerWeek = weeklyCalorieDeficit / CALORIES_PER_KG_FAT;

  // Calculate weeks to goal
  const weeksToGoal = weightDifference / expectedWeightLossPerWeek;

  return {
    weeksToGoal: Math.ceil(weeksToGoal),
    dailyCalorieDeficit: isWeightLoss
      ? adjustedDailyDeficit
      : -adjustedDailyDeficit,
    expectedWeightLossPerWeek: isWeightLoss
      ? expectedWeightLossPerWeek
      : -expectedWeightLossPerWeek,
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
  const dailyDeficit = (safeWeeklyLoss * CALORIES_PER_KG_FAT) / 7;

  // Return positive deficit for weight loss, negative for weight gain
  return Math.round(isWeightLoss ? dailyDeficit : -dailyDeficit);
}

/**
 * Calculate adjusted calorie intake based on TDEE and weight goal
 * @param tdee - Total Daily Energy Expenditure (maintenance calories)
 * @param currentWeight - Current weight in kg
 * @param targetWeight - Target weight in kg
 * @param targetWeeks - Optional: Desired timeframe in weeks (defaults to 12)
 * @returns Adjusted daily calorie intake to achieve goal
 */
export function calculateAdjustedCalorieIntake(
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
 * @returns Complete weight goals with calculations
 */
export function generateWeightGoalCalculations(
  tdee: number,
  currentWeight: number,
  targetWeight: number
): Partial<WeightGoals> {
  const adjustedCalorieIntake = calculateAdjustedCalorieIntake(
    tdee,
    currentWeight,
    targetWeight
  );

  const calorieDeficit = tdee - adjustedCalorieIntake;
  const { weeksToGoal, expectedWeightLossPerWeek } = calculateTimeToGoal(
    currentWeight,
    targetWeight,
    Math.abs(calorieDeficit)
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
    adjustedCalorieIntake,
    targetDate: targetDate.toISOString().split("T")[0],
    calculatedWeeks: weeksToGoal,
    weeklyChange: expectedWeightLossPerWeek,
    dailyDeficit: calorieDeficit,
  };
}
