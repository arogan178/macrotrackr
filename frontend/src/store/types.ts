// types.ts
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

export interface MacroDistributionSettings {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
  locked_macros?: string[];
}

export interface UserDetails {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth?: string;
  height?: number;
  weight?: number;
  activity_level?: number;
  gender?: "male" | "female";
  macro_distribution?: MacroDistributionSettings;
}

export type Gender = "Male" | "Female";
export const GENDER: Gender[] = ["Male", "Female"];

export interface RegistrationStep1 {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface RegistrationStep2 {
  dateOfBirth: string;
  height: number;
  weight: number;
}

export interface RegistrationStep3 {
  activityLevel: "sedentary" | "light" | "moderate" | "very" | "extra";
}
