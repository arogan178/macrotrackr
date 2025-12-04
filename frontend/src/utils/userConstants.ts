/**
 * Shared user constants for activity levels and gender
 * These are used across auth, settings, and types
 */

import { calculateBMR, calculateTDEE } from "@/utils/nutritionCalculations";

// Activity level type - used across the app
export type ActivityLevel = "sedentary" | "low" | "medium" | "high" | "athlete";

// Type for Gender - derived from GENDER_OPTIONS
export type Gender = "male" | "female" | "";

// Minimal interface for createNutritionProfile to avoid circular imports
// The full UserSettings type is in @/types/user
interface UserSettingsForProfile {
  id: number;
  weight: number | undefined;
  height: number | undefined;
  dateOfBirth: string | undefined;
  gender: "male" | "female" | undefined;
  activityLevel: number | undefined;
}

export interface UserNutritionalProfile {
  userId: number;
  bmr: number;
  tdee: number;
}

// Gender options for forms
export const GENDER_OPTIONS = [
  { value: "", label: "Select gender" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
] as const;

// Primary source of truth for activity levels
// Backend uses 1-5 numbers, conversion happens at API boundary
export const ACTIVITY_LEVELS: Record<
  number,
  {
    label: string;
    value: ActivityLevel;
    multiplier: number;
  }
> = {
  1: {
    label: "Sedentary (little or no exercise)",
    value: "sedentary",
    multiplier: 1,
  },
  2: {
    label: "Lightly active (light exercise 1-3 days/week)",
    value: "low",
    multiplier: 1.2,
  },
  3: {
    label: "Moderately active (moderate exercise 3-5 days/week)",
    value: "medium",
    multiplier: 1.35,
  },
  4: {
    label: "Very active (hard exercise 6-7 days/week)",
    value: "high",
    multiplier: 1.5,
  },
  5: {
    label: "Extremely active (very hard exercise & physical job)",
    value: "athlete",
    multiplier: 1.75,
  },
};

// Helper functions for activity level lookups
export function getActivityLevelLabel(level: number): string {
  return ACTIVITY_LEVELS[level]?.label || "Unknown";
}

export function getActivityLevelValue(level: number): ActivityLevel {
  return ACTIVITY_LEVELS[level]?.value || "sedentary";
}

export function getActivityLevelMultiplier(level: number): number {
  return ACTIVITY_LEVELS[level]?.multiplier || 1;
}

export function getActivityLevelFromString(value: ActivityLevel): number {
  for (const [key, data] of Object.entries(ACTIVITY_LEVELS)) {
    if (data.value === value) return Number(key);
  }
  return 1; // Default to sedentary if not found
}

/**
 * Calculate age from birthdate string (YYYY-MM-DD format)
 */
export function calculateAge(birthDate: string): number {
  const birth = new Date(birthDate);
  const now = new Date();
  let age = now.getFullYear() - birth.getFullYear();
  const m = now.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) {
    age--;
  }
  return Math.max(0, Math.min(120, age));
}

/**
 * Create a nutrition profile (BMR/TDEE) from user settings
 * This is a convenience function used across multiple features
 */
export function createNutritionProfile(
  settings: UserSettingsForProfile,
): UserNutritionalProfile {
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
    tdee = Math.round(
      calculateTDEE(bmr, getActivityLevelMultiplier(settings.activityLevel)),
    );
  }

  return {
    userId: settings.id,
    bmr,
    tdee,
  };
}
