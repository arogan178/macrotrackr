/**
 * Shared user constants for activity levels and gender
 * These are used across auth, settings, and types
 */

import type { ActivityLevel } from "@/types/activity";
import { calculateBMR, calculateTDEE } from "@/utils/nutritionCalculations";

export interface NutritionProfileSource {
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
  // The standard Mifflin-St Jeor activity factors. These were 1 / 1.2 / 1.35 /
  // 1.5 / 1.75 — every level roughly one step low, and sedentary at 1.0, which
  // says a sedentary person's daily burn equals their resting burn. Nobody's
  // does: digesting food and incidental movement account for ~20% before any
  // exercise, which is exactly what the 1.2 floor represents.
  1: {
    label: "Sedentary (little or no exercise)",
    value: "sedentary",
    multiplier: 1.2,
  },
  2: {
    label: "Lightly active (light exercise 1-3 days/week)",
    value: "low",
    multiplier: 1.375,
  },
  3: {
    label: "Moderately active (moderate exercise 3-5 days/week)",
    value: "medium",
    multiplier: 1.55,
  },
  4: {
    label: "Very active (hard exercise 6-7 days/week)",
    value: "high",
    multiplier: 1.725,
  },
  5: {
    label: "Extremely active (very hard exercise & physical job)",
    value: "athlete",
    multiplier: 1.9,
  },
};

// Helper functions for activity level lookups
export function getActivityLevelLabel(level: number): string {
  const activity = ACTIVITY_LEVELS[level];

  return activity ? activity.label : "Unknown";
}

export function getActivityLevelValue(level: number): ActivityLevel {
  const activity = ACTIVITY_LEVELS[level];

  return activity ? activity.value : "sedentary";
}

export function getActivityLevelMultiplier(level: number): number {
  const activity = ACTIVITY_LEVELS[level];

  // Falling back to 1 had the same effect as the old sedentary value: a user
  // with no activity level set was told their daily burn was their resting
  // burn. The sedentary floor is the conservative answer, not 1.
  return activity ? activity.multiplier : ACTIVITY_LEVELS[1].multiplier;
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
  settings: NutritionProfileSource,
): UserNutritionalProfile {
  const age = calculateAge(settings.dateOfBirth ?? "");
  let bmr = 0;
  let tdee = 0;

  if (
    settings.weight &&
    settings.height &&
    settings.dateOfBirth &&
    (settings.gender === "male" || settings.gender === "female") &&
    settings.activityLevel != null
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