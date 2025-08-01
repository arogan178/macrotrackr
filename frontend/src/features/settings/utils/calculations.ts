import type { MacroTargetGrams } from "@/types/macro";
import type {
  ActivityLevel,
  Gender,
  UserNutritionalProfile,
  UserSettings,
} from "@/types/user";
import {
  calculateBMR as calculateBMRCore,
  calculateTDEE as calculateTDEECore,
} from "@/utils/nutritionCalculations";

import { ACTIVITY_LEVELS } from "./constants";

// Pure calculation functions - independent of domain-specific types
/**
 * Calculate BMR using the Mifflin-St Jeor Equation
 */

function calculateAgeValue(birthDate: Date): number {
  const now = new Date();
  let age = now.getFullYear() - birthDate.getFullYear();
  const m = now.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, Math.min(120, age));
}
function calculateBMRValue(
  weight: number,
  height: number,
  age: number,
  isMale: boolean,
): number {
  return calculateBMRCore(
    weight,
    height,
    age,
    isMale ? ("male" as Gender) : ("female" as Gender),
  );
}
function calculateTDEEValue(bmr: number, activityMultiplier: number): number {
  return calculateTDEECore(bmr, activityMultiplier);
}

/**
 * Calculate macros based on calorie goal and macro percentages
 */
function calculateMacrosValue(
  calorieGoal: number,
  proteinPercentage: number,
  carbsPercentage: number,
  fatsPercentage: number,
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
  gender: Gender,
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
  activityLevel: ActivityLevel,
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
  fatPercentage: number,
): MacroTargetGrams {
  return calculateMacrosValue(
    calorieGoal,
    proteinPercentage,
    carbsPercentage,
    fatPercentage,
  );
}

// Helper function to create nutrition profile from user settings
export const createNutritionProfile = (
  settings: UserSettings,
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
      calculateBMR(settings.weight, settings.height, age, settings.gender),
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
export const createUserSettings = (
  userData: Partial<UserSettings>,
): UserSettings => ({
  id: userData.id!,
  firstName: userData.firstName!,
  lastName: userData.lastName!,
  email: userData.email!,
  dateOfBirth: userData.dateOfBirth!,
  height: userData.height!,
  weight: userData.weight!,
  activityLevel: userData.activityLevel!,
  gender: userData.gender!,
  subscription: userData.subscription,
});
