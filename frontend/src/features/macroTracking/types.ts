import { MacroTargetPercentages } from "../settings/types";

// Define the type for the clean meal values (used in state and sent to API)
export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MacroEntry {
  id: number;
  created_at: string;
  protein: number;
  carbs: number;
  fats: number;
  mealType: MealType;
  mealName: string;
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
