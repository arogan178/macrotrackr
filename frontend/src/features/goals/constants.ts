/**
 * Calorie and macro calculation constants
 */
export const CALORIE_ADJUSTMENT_FACTORS = {
  lose: -500,
  maintain: 0,
  gain: 300,
} as const;

// Calorie range slider labels by goal type
export const CALORIE_RANGE_LABELS = {
  lose: { min: "Faster", mid: "TDEE", max: "Slower" },
  maintain: { min: "Less calories", mid: "TDEE", max: "More calories" },
  gain: { min: "Slower", mid: "TDEE", max: "Faster" },
} as const;

// Default macro totals - imported from centralized location
export { DEFAULT_MACRO_TOTALS } from "@/utils/constants/nutrition";

export const DEFAULT_TARGET_VALUES = {
  proteinPercentage: 30,
  carbsPercentage: 40,
  fatsPercentage: 30,
  lockedMacros: [],
};

export const DAILY_PROTEIN_PER_KG = 2.1;
export const CARBS_PERCENTAGE = 0.5;
export const FATS_PERCENTAGE = 0.25;

/**
 * Weight and calorie calculations
 */
export const CALORIES_PER_KG_FAT = 7700;
export const MIN_SAFE_DAILY_CHANGE = 500;
export const MAX_SAFE_DAILY_CHANGE = 1000;
export const MIN_WEEKLY_WEIGHT_LOSS = 0.5;
export const MAX_WEEKLY_WEIGHT_LOSS = 1;
export const DEFAULT_TARGET_WEEKS = 12;

/**
 * Non-Tailwind UI tokens are kept colocated with components.
 * Tailwind utility class names are NOT centralized here to follow Tailwind best practices.
 * Only semantic, non-class constants remain in this module.
 */

// Weight goal options (semantic values only)
export const WEIGHT_GOAL_OPTIONS = [
  { value: "lose", label: "Lose Weight", color: "text-vibrant-accent" },
  { value: "maintain", label: "Maintain Weight", color: "text-primary" },
  { value: "gain", label: "Gain Weight", color: "text-success" },
] as const;

// Chart configuration (semantic hex colors are acceptable centralization)
export const CHART_COLORS = {
  weight: "#3B82F6", // blue
  target: "#EF4444", // red
  trend: "#10B981", // green
  progress: "#8B5CF6", // purple
} as const;

/**
 * Validation constants
 */
export const WEIGHT_VALIDATION = {
  min: 1,
  max: 1000,
  minCalories: 1000,
  maxWeeksInPast: 104,
} as const;

/**
 * Success and error messages
 */
export const SUCCESS_MESSAGES = {
  goalCreated: "Weight goal created successfully!",
  goalUpdated: "Weight goal updated successfully!",
  goalDeleted: "Weight goal deleted successfully!",
  weightLogged: "Weight logged successfully!",
  weightDeleted: "Weight entry deleted successfully!",
} as const;

export const ERROR_MESSAGES = {
  goalCreate: "Failed to create weight goal",
  goalUpdate: "Failed to update weight goal",
  goalDelete: "Failed to delete weight goal",
  goalFetch: "Failed to load weight goals",
  weightLog: "Failed to log weight",
  weightDelete: "Failed to delete weight entry",
  weightFetch: "Failed to load weight log",
  validation: "Please check your input and try again",
  network: "Network error. Please try again.",
} as const;

/**
 * Removed GOAL_STATUS_COLORS of Tailwind class strings from centralized constants
 * to avoid breaking Tailwind's recommended colocation pattern for utility classes.
 * Components should keep Tailwind classnames inline where they are used so Purge/scan works
 * and to maintain local styling clarity.
 */
