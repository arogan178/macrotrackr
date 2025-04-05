import { CALORIE_ADJUSTMENT_FACTORS } from "./constants";
import { MacroTargetSettings } from "@/features/macroTracking/types";
import { ReactNode } from "react";

export interface WeightGoals {
  currentWeight: number;
  targetWeight: number;
  weightGoal: WeightGoal;
  startDate: string; // Required field with proper format
  targetDate: string; // Required field with proper format
  calorieTarget: number; // Changed from adjustedCalorieIntake to match backend
  calculatedWeeks: number;
  weeklyChange: number;
  dailyChange: number;
}

export interface MacroTarget {
  macroTarget?: MacroTargetSettings;
}

// Habit Goals related types
export interface HabitGoal {
  id: string;
  title: string;
  iconName: string;
  current: number;
  target: number;
  progress: number;
  accentColor?: "indigo" | "blue" | "green" | "purple";
  isComplete?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface GoalsState {
  weightGoals: WeightGoals | null;
  macroTarget: MacroTarget | null;
  habitGoals: HabitGoal[];
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
  targetWeight: number | undefined;
  startDate?: string;
  targetDate?: string;
  calorieTarget?: number;
  weeklyChange?: number;
  calculatedWeeks?: number;
  weightGoal?: WeightGoal;
}

export interface WeightGoalCardProps {
  currentWeight: number;
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

// Form values for creating/updating a habit goal
export interface HabitGoalFormValues {
  title: string;
  iconName: string;
  target: number;
  accentColor?: "indigo" | "blue" | "green" | "purple";
}
