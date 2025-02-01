// types.ts
type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MacroEntry {
  id: number;
  protein: number;
  carbs: number;
  fats: number;
  created_at: string;
  meal_type: MealType;
}

export interface MacroTotals {
  total_protein: number;
  total_carbs: number;
  total_fats: number;
  calories: number;
}

export interface MacroInputs {
  protein: string;
  carbs: string;
  fats: string;
}

export interface UserDetails {
  id: number;
  full_name: string;
  email: string;
}
