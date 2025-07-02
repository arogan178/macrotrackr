import { MacroDailyTotals, MealType } from "./types";

// Default values
export const DEFAULT_MACRO_TOTALS: MacroDailyTotals = {
  protein: 0,
  carbs: 0,
  fats: 0,
  calories: 0,
};

// Calorie conversion constants
export const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fats: 9,
} as const;

// Meal type display options
export const MEAL_TYPE_OPTIONS = [
  { value: "breakfast" as MealType, display: "Breakfast 🍳" },
  { value: "lunch" as MealType, display: "Lunch 🍗" },
  { value: "dinner" as MealType, display: "Dinner 🍽️" },
  { value: "snack" as MealType, display: "Snack 🧃" },
] as const;

// Helper function to get meal type display name
export const getMealTypeDisplay = (mealType: MealType): string => {
  const option = MEAL_TYPE_OPTIONS.find((opt) => opt.value === mealType);
  return option?.display || mealType;
};

// Helper function to get today's date string
export const getTodayDateString = (): string => {
  return new Date().toISOString().split("T")[0];
};
