// Shared utilities for nutrition visualizations (MealTimeBreakdown, MacroDensityBreakdown)

// Re-export colors from centralized chart colors to avoid duplication
export { MACRO_COLORS, MEAL_COLORS } from "./chartColors";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export function formatMealType(mealType: string): string {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}
