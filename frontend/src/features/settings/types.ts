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
}

export type MacroDistribution = {
  protein: number;
  carbs: number;
  fats: number;
};

export interface UserNutritionalProfile {
  id?: number;
  user_id?: number;
  bmr: number;
  tdee: number;
  // Target-related properties moved to goals-slice
}

// Keeping NutritionProfile for backward compatibility
export interface NutritionProfile {
  id?: number;
  user?: number;
  bmr: number;
  tdee: number;
  calorieGoal: number;
  macros?: MacroDistribution;
}
