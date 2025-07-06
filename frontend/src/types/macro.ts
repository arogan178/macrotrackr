// MacroTargetSettings: settings for macro targets (percentages or grams)
export interface MacroTargetSettings {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
  lockedMacros?: Array<"protein" | "carbs" | "fats">;
}

// Macro-related shared types
// Usage example:
// import { MacroEntry, MacroDailyTotals } from '@/types/macro';

export type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MacroEntry {
  id: number;
  createdAt: string;
  protein: number;
  carbs: number;
  fats: number;
  mealType: MealType;
  mealName: string;
  entryDate: string;
  entryTime: string;
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
