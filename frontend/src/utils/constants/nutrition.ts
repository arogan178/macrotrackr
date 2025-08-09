// Nutrition-related shared constants
// Usage example:
// import { CALORIES_PER_GRAM } from '@/utils/constants/nutrition';

export const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fats: 9,
} as const;

// Central macro totals default used across the app
export const DEFAULT_MACRO_TOTALS = {
  protein: 0,
  carbs: 0,
  fats: 0,
  calories: 0,
} as const;
