import { CALORIE_ADJUSTMENT_FACTORS } from "./constants";
import { MacroTargetSettings } from "@/features/macroTracking/types";

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

export interface WeightGoalFormValues {
  startingWeight: number;
  targetWeight: number | undefined;
  startDate?: string;
  targetDate?: string;
  calorieTarget?: number;
  weeklyChange?: number;
  calculatedWeeks?: number;
  weightGoal?: WeightGoal;
}

export interface WeightGoalCardProps {
  startingWeight: number;
  targetWeight: number;
  tdee: number;
  isLoading?: boolean;
  onSave: (values: WeightGoalFormValues) => void;
  className?: string;
  mode?: "create" | "view";
  startDate?: string | Date;
  targetDate?: string | Date;
  progressPercentage?: number;
  weightRemaining?: number;
  insight?: string;
}

export interface WeightDetailsCardProps {
  goalData: WeightGoals;
  tdee: number;
}

export type WeightGoal = keyof typeof CALORIE_ADJUSTMENT_FACTORS;
