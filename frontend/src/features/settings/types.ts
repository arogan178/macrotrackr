import { CALORIE_ADJUSTMENT_FACTORS } from "./constants";

// Single consolidated type for all activity/exercise levels
export type ActivityLevel = "sedentary" | "low" | "medium" | "high" | "athlete";

export interface MacroDistributionSettings {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
  locked_macros?: string[];
}

export type Gender = "male" | "female";

export interface UserDetails {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth?: string;
  height?: number;
  weight?: number;
  activity_level?: ActivityLevel;
  gender?: Gender;
  macro_distribution?: MacroDistributionSettings;
}
export type WeightGoal = keyof typeof CALORIE_ADJUSTMENT_FACTORS;
export type MacroDistribution = {
  protein: number;
  carbs: number;
  fat: number;
};

export interface NutritionProfile {
  id?: number;
  user?: number;
  bmr: number;
  tdee: number;
  calorieGoal: number;
  macros?: MacroDistribution;
}
