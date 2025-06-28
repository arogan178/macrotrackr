// Goal-related shared types
// Usage example:
// import { WeightGoal, WeightGoals, WeightGoalFormValues } from '@/types/goal';

export type WeightGoal = "lose" | "maintain" | "gain";

export interface WeightGoalFormValues {
  startingWeight?: number;
  targetWeight?: number;
  startDate?: string;
  targetDate?: string;
  calorieTarget?: number;
  weeklyChange?: number;
  calculatedWeeks?: number;
  weightGoal?: string;
}

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
