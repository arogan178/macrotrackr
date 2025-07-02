import {
  Gender,
  ActivityLevel,
  MacroTargetGrams,
  UserSettings,
  UserNutritionalProfile,
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
  // Add proper validation to avoid negative values
  if (!weight || !height || !age || weight <= 0 || height <= 0 || age <= 0) {
    return 0;
  }

  // Ensure we're using the correct formula with reasonable constraints
  const safeWeight = Math.max(30, Math.min(300, weight)); // Limit weight to realistic range
  const safeHeight = Math.max(100, Math.min(250, height)); // Limit height to realistic range
  const safeAge = Math.min(120, Math.max(1, age)); // Limit age to realistic range

  // Mifflin-St Jeor Equation
  const baseCalculation = 10 * safeWeight + 6.25 * safeHeight - 5 * safeAge;
  const bmr = isMale ? baseCalculation + 5 : baseCalculation - 161;

  // Ensure BMR is always positive and reasonable
  return Math.max(500, bmr); // Minimum realistic BMR
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
): MacroTargetGrams {
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

/**
 * Calculate macros for a given calorie goal and target
 */
export function calculateMacros(
  calorieGoal: number,
  proteinPercentage: number,
  carbsPercentage: number,
  fatPercentage: number
): MacroTargetGrams {
  return calculateMacrosValue(
    calorieGoal,
    proteinPercentage,
    carbsPercentage,
    fatPercentage
  );
}

// Helper function to create nutrition profile from user settings
export const createNutritionProfile = (
  settings: UserSettings
): UserNutritionalProfile => {
  const age = calculateAge(settings.dateOfBirth || "");
  let bmr = 0;
  let tdee = 0;

  if (
    settings.weight &&
    settings.height &&
    settings.dateOfBirth &&
    settings.gender &&
    settings.activityLevel
  ) {
    bmr = Math.round(
      calculateBMR(settings.weight, settings.height, age, settings.gender)
    );
    tdee = Math.round(calculateTDEE(bmr, settings.activityLevel));
  }

  return {
    userId: settings.id,
    bmr,
    tdee,
  };
};

// Helper function to create user settings from API data
export const createUserSettings = (userData: any): UserSettings => ({
  id: userData.id,
  firstName: userData.firstName,
  lastName: userData.lastName,
  email: userData.email,
  dateOfBirth: userData.dateOfBirth,
  height: userData.height,
  weight: userData.weight,
  activityLevel: userData.activityLevel,
  gender: userData.gender,
});
