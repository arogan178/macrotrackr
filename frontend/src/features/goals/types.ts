import { CALORIE_ADJUSTMENT_FACTORS } from "./constants";
import { MacroTargetSettings } from "@/features/macroTracking/types";
import { WeightGoalFormValues } from "@/utils/api-service";

export type WeightGoal = keyof typeof CALORIE_ADJUSTMENT_FACTORS;

// Interface for the fully formed weight goals with required fields
export interface WeightGoals {
  startingWeight: number;
  currentWeight: number;
  targetWeight: number;
  weightGoal: WeightGoal;
  startDate: string;
  targetDate: string;
  calorieTarget: number;
  calculatedWeeks: number;
  weeklyChange: number;
  dailyChange: number;
}

// Interface for API responses that can have nullable fields
export interface WeightGoalsResponse {
  startingWeight: number;
  targetWeight: number | null;
  weightGoal: WeightGoal | null;
  startDate: string | null;
  targetDate: string | null;
  calorieTarget: number | null;
  calculatedWeeks: number | null;
  weeklyChange: number | null;
  dailyChange: number | null;
}

export interface MacroTarget {
  macroTarget?: MacroTargetSettings;
}

export interface GoalsState {
  weightGoals: WeightGoals | null;
  macroTarget: MacroTarget | null;
  isLoading: boolean;
  error: string | null;
}

export interface TimeToGoalCalculation {
  weeksToGoal: number;
  dailyCalorieDeficit: number;
  expectedWeightLossPerWeek: number;
}

// Re-export WeightGoalFormValues from api-service.ts
export type { WeightGoalFormValues };
