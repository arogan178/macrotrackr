// Goal-related shared types

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
  dailyChange?: number;
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
