import { CALORIE_ADJUSTMENT_FACTORS } from "./constants";
import { MacroTargetSettings } from "@/features/macroTracking/types";

// Single consolidated type for all activity/exercise levels
export type ActivityLevel = "sedentary" | "low" | "medium" | "high" | "athlete";

export type Gender = "male" | "female";

export interface UserSettings {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth?: string;
  height?: number;
  weight?: number;
  activity_level?: ActivityLevel;
  gender?: Gender;
  macro_distribution?: MacroTargetSettings;
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
