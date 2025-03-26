export type MealType = "breakfast 🍳" | "lunch 🍗" | "dinner 🍽️" | "snack 🧃";

// Constant array of all possible meal types for selection options
export const MEAL_TYPES: MealType[] = [
  "breakfast 🍳",
  "lunch 🍗",
  "dinner 🍽️",
  "snack 🧃",
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

export interface MacroTotals {
  protein: number;
  carbs: number;
  fats: number;
}

export interface MacroInputs {
  protein: string;
  carbs: string;
  fats: string;
}
