// types.ts
type MealType = "breakfast" | "lunch" | "dinner" | "snack";

export interface MacroEntry {
  id: number;
  created_at: string;
  protein: number;
  carbs: number;
  fats: number;
  meal_type: MealType;
  foodName?: string; // New field
  time?: string; // New field
}

export interface MacroTotals {
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
