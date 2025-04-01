// Calorie adjustment factors based on goal
export const CALORIE_ADJUSTMENT_FACTORS = {
  lose: -500, // 500 calorie deficit
  maintain: 0, // No adjustment
  gain: 300, // 300 calorie surplus
} as const;

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
