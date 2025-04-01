import { MacroTargetPercentages } from "../settings/types";

// Define the type for the clean meal values (used in state and sent to API)
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

// Define the structure for dropdown options
interface MealTypeOption {
  value: MealType; // The clean value
  display: string; // The label shown to the user (with emoji)
}

// Constant array holding the option objects
export const MEAL_TYPE_OPTIONS: MealTypeOption[] = [
  { value: "breakfast", display: "Breakfast 🍳" },
  { value: "lunch", display: "Lunch 🍗" },
  { value: "dinner", display: "Dinner 🍽️" },
  { value: "snack", display: "Snack 🧃" },
];

export interface MacroEntry {
  id: number;
  created_at: string;
  protein: number;
  carbs: number;
  fats: number;
  meal_type: MealType;
  meal_name: string;
  entry_date: string;
  entry_time: string;
  foodName?: string;
}

export interface MacroDailyTotals {
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
}

export interface MacroInputs {
  protein: string;
  carbs: string;
  fats: string;
}

export interface MacroTargetSettings {
  proteinPercentage: MacroTargetPercentages["proteinPercentage"];
  carbsPercentage: MacroTargetPercentages["carbsPercentage"];
  fatsPercentage: MacroTargetPercentages["fatsPercentage"];
  lockedMacros?: MacroTargetPercentages["lockedMacros"];
}
