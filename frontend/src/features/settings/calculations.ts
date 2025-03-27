import {
  Gender,
  ActivityLevel,
  MacroDistribution,
  NutritionProfile,
} from "./types";
import { ACTIVITY_LEVELS } from "./constants";

// Pure calculation functions - independent of domain-specific types
/**
 * Calculate BMR using the Mifflin-St Jeor Equation
 */

function calculateAgeValue(birthDate: Date): number {
  const age = new Date().getFullYear() - new Date(birthDate).getFullYear();
  return age;
}

function calculateBMRValue(
  weight: number,
  height: number,
  age: number,
  isMale: boolean
): number {
  if (!weight || !height || !age) return 0;

  const baseCalculation = 10 * weight + 6.25 * height - 5 * age;
  return isMale ? baseCalculation + 5 : baseCalculation - 161;
}

/**
 * Calculate TDEE based on BMR and activity multiplier
 */
function calculateTDEEValue(bmr: number, activityMultiplier: number): number {
  if (!bmr) return 0;
  return Math.round(bmr * activityMultiplier);
}

/**
 * Calculate calorie goal based on TDEE and adjustment factor
 */
function calculateCalorieGoalValue(
  tdee: number,
  adjustmentFactor: number
): number {
  if (!tdee) return 0;
  return Math.round(tdee * adjustmentFactor);
}

/**
 * Calculate macros based on calorie goal and macro percentages
 */
function calculateMacrosValue(
  calorieGoal: number,
  proteinPercentage: number,
  carbsPercentage: number,
  fatsPercentage: number
): MacroDistribution {
  if (!calorieGoal) return { protein: 0, carbs: 0, fats: 0 };

  return {
    protein: Math.round((calorieGoal * proteinPercentage) / 4),
    carbs: Math.round((calorieGoal * carbsPercentage) / 4),
    fats: Math.round((calorieGoal * fatsPercentage) / 9),
  };
}

// Domain-specific adapter functions

export function calculateAge(birthDate: string): number {
  return calculateAgeValue(new Date(birthDate));
}
/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor Equation
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @param age - Age in years
 * @param gender - 'male' or 'female'
 * @returns BMR in calories per day
 */
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: Gender
): number {
  return calculateBMRValue(weight, height, age, gender === "male");
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) based on numeric activity level
 * @param bmr - Basal Metabolic Rate
 * @param activityLevel - Numeric activity level (1-5)
 * @returns TDEE in calories per day
 */
export function calculateTDEE(bmr: number, activityLevel: number): number {
  // Get the multiplier for the numeric activity level
  const multiplier =
    ACTIVITY_LEVELS[activityLevel]?.multiplier || ACTIVITY_LEVELS[1].multiplier; // Default to sedentary

  return calculateTDEEValue(bmr, multiplier);
}

/**
 * Calculate TDEE directly with string activity level
 * @param bmr - Basal Metabolic Rate
 * @param activityLevel - String activity level (sedentary, low, etc.)
 * @returns TDEE in calories per day
 */
export function calculateTDEEByActivityLevel(
  bmr: number,
  activityLevel: ActivityLevel
): number {
  // Find the correct activity level entry and its multiplier
  let multiplier = ACTIVITY_LEVELS[1].multiplier; // Default to sedentary

  for (const level of Object.values(ACTIVITY_LEVELS)) {
    if (level.value === activityLevel) {
      multiplier = level.multiplier;
      break;
    }
  }

  return calculateTDEEValue(bmr, multiplier);
}

// /**
//  * Calculates daily calorie goal based on TDEE and weight goal
//  * @param tdee - Total Daily Energy Expenditure
//  * @param goal - Weight management goal
//  * @returns Daily calorie goal
//  */
// export function calculateCalorieGoal(tdee: number, goal: WeightGoal): number {
//   const adjustmentFactor =
//     CALORIE_ADJUSTMENT_FACTORS[goal] || CALORIE_ADJUSTMENT_FACTORS.maintain;
//   return calculateCalorieGoalValue(tdee, adjustmentFactor);
// }

// /**
//  * Calculates full nutrition profile from basic user information
//  * @param weight - Weight in kg
//  * @param height - Height in cm
//  * @param age - Age in years
//  * @param gender - 'male' or 'female'
//  * @param exerciseFrequency - How often the person exercises
//  * @param goal - Weight management goal
//  * @returns Complete nutrition profile with BMR, TDEE, calorie goal and macros
//  */

// export function calculateNutritionProfile(
//   weight: number,
//   height: number,
//   age: number,
//   gender: Gender,
//   activityLevel: ActivityLevel,
//   goal: WeightGoal
// ): NutritionProfile {
//   const bmr = calculateBMR(weight, height, age, gender);
//   const tdee = calculateTDEE(bmr, activityLevel);
//   const calorieGoal = calculateCalorieGoal(tdee, goal);

//   return {
//     bmr,
//     tdee,
//     calorieGoal,
//   };
// }

/**
 * Calculate macros for a given calorie goal and distribution
 */
export function calculateMacros(
  calorieGoal: number,
  proteinPercentage: number,
  carbsPercentage: number,
  fatPercentage: number
): MacroDistribution {
  return calculateMacrosValue(
    calorieGoal,
    proteinPercentage,
    carbsPercentage,
    fatPercentage
  );
}
