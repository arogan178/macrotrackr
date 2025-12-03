/**
 * Shared user constants for activity levels and gender
 * These are used across auth, settings, and types
 */

// Activity level type - used across the app
export type ActivityLevel = "sedentary" | "low" | "medium" | "high" | "athlete";

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
