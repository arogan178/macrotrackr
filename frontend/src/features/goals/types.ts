import { MacroTargetSettings } from "@/types/macro";
import { WeightGoal, WeightGoalFormValues, WeightGoals } from "@/types/goal";

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

// Payload types for API calls
export interface SetWeightGoalPayload {
  startingWeight: number; // Required for creation
  targetWeight: number | null;
  weightGoal: WeightGoal | null;
  startDate: string | null;
  targetDate: string | null;
  calorieTarget: number | null;
  calculatedWeeks: number | null;
  weeklyChange: number | null;
  dailyChange: number | null;
}

// Payload for updates (omits startingWeight)
export interface UpdateWeightGoalPayload
  extends Omit<SetWeightGoalPayload, "startingWeight"> {}

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
