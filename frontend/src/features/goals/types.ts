import { CALORIE_ADJUSTMENT_FACTORS } from "./constants";

export interface WeightGoals {
  currentWeight: number;
  targetWeight: number;
  weightGoal: WeightGoal;
  targetDate?: string;
  adjustedCalorieIntake?: number;
  calculatedWeeks?: number;
  weeklyChange?: number;
  dailyDeficit?: number;
}

export interface GoalsState {
  weightGoals: WeightGoals | null;
  isLoading: boolean;
  error: string | null;
}

export interface TimeToGoalCalculation {
  weeksToGoal: number;
  dailyCalorieDeficit: number;
  expectedWeightLossPerWeek: number;
}

export interface WeightGoalFormValues {
  currentWeight: number;
  targetWeight: number;
  targetDate?: string;
}

export interface WeightGoalCardProps {
  currentWeight: number;
  targetWeight: number;
  tdee: number;
  isLoading?: boolean;
  onSave: (goals: WeightGoalFormValues) => void;
}

export interface GoalSummaryCardProps {
  goalData: WeightGoals;
  tdee: number;
}

export type WeightGoal = keyof typeof CALORIE_ADJUSTMENT_FACTORS;
