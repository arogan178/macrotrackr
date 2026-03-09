import { MealType } from "@/types/macro";

// Default values - re-export from centralized constants
export { DEFAULT_MACRO_TOTALS } from "@/utils/constants/nutrition";

// Calorie conversion constants now imported from shared

// Meal type display options
export const MEAL_TYPE_OPTIONS = [
  { value: "breakfast" as MealType, display: "Breakfast" },
  { value: "lunch" as MealType, display: "Lunch" },
  { value: "dinner" as MealType, display: "Dinner" },
  { value: "snack" as MealType, display: "Snack" },
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
