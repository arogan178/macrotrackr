import { WeightGoal, WeightGoals } from "@/types/goal";
import type { MacroTarget } from "@/types/macro";

// Interface for API responses that can have undefinedable fields
export interface WeightGoalsResponse {
  startingWeight: number;
  targetWeight: number | undefined;
  weightGoal: WeightGoal | undefined;
  startDate: string | undefined;
  targetDate: string | undefined;
  calorieTarget: number | undefined;
  calculatedWeeks: number | undefined;
  weeklyChange: number | undefined;
  dailyChange: number | undefined;
}

// Payload types for API calls
export interface SetWeightGoalPayload {
  startingWeight: number; // Required for creation
  targetWeight: number | undefined;
  weightGoal: WeightGoal | undefined;
  startDate: string | undefined;
  targetDate: string | undefined;
  calorieTarget: number | undefined;
  calculatedWeeks: number | undefined;
  weeklyChange: number | undefined;
  dailyChange: number | undefined;
}

// Payload for updates (omits startingWeight)
export type UpdateWeightGoalPayload = Omit<
  SetWeightGoalPayload,
  "startingWeight"
>;

export interface GoalsState {
  weightGoals: WeightGoals |  null;
  macroTarget: MacroTarget | null;
  isLoading: boolean;
  error: string | null;
}

export interface TimeToGoalCalculation {
  weeksToGoal: number;
  dailyCalorieDeficit: number;
  expectedWeightLossPerWeek: number;
}

export { type WeightGoalFormValues } from "@/types/goal";
