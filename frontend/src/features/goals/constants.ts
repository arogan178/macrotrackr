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
