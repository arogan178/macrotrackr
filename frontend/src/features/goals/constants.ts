// Calorie adjustment factors based on goal
export const CALORIE_ADJUSTMENT_FACTORS = {
  lose: -500, // 500 calorie deficit
  maintain: 0, // No adjustment
  gain: 300, // 300 calorie surplus
} as const;

export const DEFAULT_TARGET_VALUES = {
  proteinPercentage: 30,
  carbsPercentage: 40,
  fatsPercentage: 30,
  lockedMacros: [],
};
export const DAILY_PROTEIN_PER_KG = 2; // 2g protein per kg bodyweight
export const CARBS_PERCENTAGE = 0.5; // 50% of calories from carbs
export const FATS_PERCENTAGE = 0.25; // 25% of calories from fats

export const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fats: 9,
} as const;

// Constants for weight and calorie calculations
export const CALORIES_PER_KG_FAT = 7700; // Approximately 7700 calories per kg of body fat
export const MIN_SAFE_DAILY_CHANGE = 500; // Minimum safe daily calorie deficit
export const MAX_SAFE_DAILY_CHANGE = 1000; // Maximum safe daily calorie deficit
export const MIN_WEEKLY_WEIGHT_LOSS = 0.5; // Minimum recommended weight loss per week (kg)
export const MAX_WEEKLY_WEIGHT_LOSS = 1.0; // Maximum recommended weight loss per week (kg)
export const DEFAULT_TARGET_WEEKS = 12; // Default timeframe for goal calculations

// Goal status colors and styling
export const GOAL_STATUS_COLORS = {
  "on-track": {
    bg: "bg-green-500/10",
    border: "border-green-500/20",
    text: "text-green-400",
    icon: "text-green-400",
  },
  ahead: {
    bg: "bg-blue-500/10",
    border: "border-blue-500/20",
    text: "text-blue-400",
    icon: "text-blue-400",
  },
  behind: {
    bg: "bg-orange-500/10",
    border: "border-orange-500/20",
    text: "text-orange-400",
    icon: "text-orange-400",
  },
  completed: {
    bg: "bg-purple-500/10",
    border: "border-purple-500/20",
    text: "text-purple-400",
    icon: "text-purple-400",
  },
} as const;

// Weight goal options
export const WEIGHT_GOAL_OPTIONS = [
  { value: "lose", label: "Lose Weight", color: "text-red-400" },
  { value: "maintain", label: "Maintain Weight", color: "text-blue-400" },
  { value: "gain", label: "Gain Weight", color: "text-green-400" },
] as const;

// Chart configuration
export const CHART_COLORS = {
  weight: "#3B82F6", // blue
  target: "#EF4444", // red
  trend: "#10B981", // green
  progress: "#8B5CF6", // purple
} as const;

// Validation constants
export const WEIGHT_VALIDATION = {
  min: 1,
  max: 1000,
  minCalories: 1000,
  maxWeeksInPast: 104, // 2 years
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  goalCreated: "Weight goal created successfully!",
  goalUpdated: "Weight goal updated successfully!",
  goalDeleted: "Weight goal deleted successfully!",
  weightLogged: "Weight logged successfully!",
  weightDeleted: "Weight entry deleted successfully!",
} as const;

// Error messages
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
