import type { WeightGoalFormValues, WeightGoals } from "@/types/goal";

import { CALORIE_ADJUSTMENT_FACTORS } from "../constants";
import type { WeightGoalsResponse } from "../types";

// Type guard to check if goals is already WeightGoals
const isWeightGoals = (goals: unknown): goals is WeightGoals => {
  return goals !== null && typeof goals === "object" && "currentWeight" in goals;
};

// Normalize WeightGoalsResponse or WeightGoals to WeightGoals
export function normalizeWeightGoals(
  goals: WeightGoalsResponse | WeightGoals | undefined,
  userWeight: number | undefined,
): WeightGoals | undefined {
  if (!goals) return undefined;

  if (isWeightGoals(goals)) {
    return {
      startingWeight: goals.startingWeight ?? 0,
      currentWeight: goals.currentWeight ?? userWeight ?? 0,
      targetWeight: goals.targetWeight ?? 0,
      weightGoal: goals.weightGoal ?? "maintain",
      startDate: goals.startDate ?? "",
      targetDate: goals.targetDate ?? "",
      calorieTarget: goals.calorieTarget ?? 0,
      calculatedWeeks: goals.calculatedWeeks ?? 0,
      weeklyChange: goals.weeklyChange ?? 0,
      dailyChange: goals.dailyChange ?? 0,
    };
  }

  if (goals.targetWeight === undefined) return undefined;

  const starting = goals.startingWeight;
  const target = goals.targetWeight ?? 0;
  const tentativeCurrent = userWeight ?? starting;

  // Prevent premature 100% progress when starting a new goal
  const currentWeight =
    starting !== target && tentativeCurrent === target
      ? starting
      : tentativeCurrent;

  return {
    startingWeight: starting,
    currentWeight,
    targetWeight: target,
    weightGoal: (goals.weightGoal ?? "maintain") as WeightGoals["weightGoal"],
    startDate: goals.startDate ?? "",
    targetDate: goals.targetDate ?? "",
    calorieTarget: goals.calorieTarget ?? 0,
    calculatedWeeks: goals.calculatedWeeks ?? 0,
    weeklyChange: goals.weeklyChange ?? 0,
    dailyChange: goals.dailyChange ?? 0,
  };
}

// Define local payload types since they're not exported from types
interface GoalPayload {
  targetWeight?: number;
  startDate?: string;
  targetDate?: string;
  weightGoal?: string;
  calorieTarget?: number;
  calculatedWeeks?: number;
  weeklyChange?: number;
  dailyChange?: number;
}

// Goal creation and update utilities
export function calculateGoalDetails(
  formValues: WeightGoalFormValues,
  tdee: number,
  existingStartDate?: string | undefined,
): GoalPayload & { weightGoal: string } {
  const {
    startingWeight, // Needed for calculation but not always sent
    targetWeight,
    startDate,
    targetDate,
    calorieTarget: customCalorieTarget,
    weeklyChange: customWeeklyChange,
    calculatedWeeks: customCalculatedWeeks,
    weightGoal: customWeightGoal,
  } = formValues;

  let weightGoal = customWeightGoal || "maintain";
  if (!customWeightGoal && startingWeight && targetWeight) {
    if (targetWeight < startingWeight) weightGoal = "lose";
    else if (targetWeight > startingWeight) weightGoal = "gain";
  }

  const today = new Date();
  const formattedToday = today.toISOString().split("T")[0];

  const calorieTarget =
    customCalorieTarget ??
    tdee +
      (CALORIE_ADJUSTMENT_FACTORS[
        weightGoal as keyof typeof CALORIE_ADJUSTMENT_FACTORS
      ] || 0);

  let calculatedWeeks = customCalculatedWeeks ?? 1;
  let weeklyChange = customWeeklyChange ?? 0;
  let dailyChange = 0;

  if (
    (calculatedWeeks <= 1 || weeklyChange === 0) &&
    startingWeight &&
    targetWeight &&
    targetDate
  ) {
    const startDateObject = existingStartDate
      ? new Date(existingStartDate)
      : startDate
        ? new Date(startDate)
        : today;
    const targetDateObject = new Date(targetDate);

    const timeDiff = targetDateObject.getTime() - startDateObject.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    calculatedWeeks = Math.max(1, Math.ceil(daysDiff / 7));

    const totalWeightChange = Math.abs(targetWeight - startingWeight);
    weeklyChange = totalWeightChange / calculatedWeeks;
    dailyChange = weeklyChange / 7;
  } else if (weeklyChange > 0) {
    dailyChange = weeklyChange / 7;
  }

  return {
    targetWeight,
    startDate: startDate || formattedToday,
    targetDate,
    weightGoal,
    calorieTarget,
    calculatedWeeks,
    weeklyChange,
    dailyChange,
  };
}

// Goal validation utilities
export function validateGoalForm(formValues: WeightGoalFormValues): string[] {
  const errors: string[] = [];

  if (!formValues.targetWeight || formValues.targetWeight <= 0) {
    errors.push("Target weight must be greater than 0");
  }

  if (
    formValues.startingWeight &&
    formValues.targetWeight &&
    Math.abs(formValues.targetWeight - formValues.startingWeight) < 0.1
  ) {
    errors.push("Target weight must be different from starting weight");
  }

  if (formValues.targetDate) {
    const targetDate = new Date(formValues.targetDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (targetDate <= today) {
      errors.push("Target date must be in the future");
    }
  }

  if (formValues.calorieTarget && formValues.calorieTarget < 1000) {
    errors.push("Calorie target should not be below 1000 calories for safety");
  }

  return errors;
}

export function isValidGoalForm(formValues: WeightGoalFormValues): boolean {
  return validateGoalForm(formValues).length === 0;
}

// Goal progress utilities
export function calculateGoalProgress(goals: WeightGoals): {
  progress: number;
  remainingWeight: number;
  isCompleted: boolean;
} {
  const { startingWeight, currentWeight, targetWeight } = goals;

  const start = Number(startingWeight);
  const current = Number(currentWeight);
  const target = Number(targetWeight);

  // Minimal guard per requirement:
  // If starting equals target, progress is 0 until current reaches target; then 100.
  if (Number.isFinite(start) && Number.isFinite(target) && start === target) {
    const isAtTarget =
      Number.isFinite(current) && Math.abs(current - target) < 1e-9;
    const remainingWhenEqual = Number.isFinite(current)
      ? Math.abs(target - current)
      : 0;

    return {
      progress: isAtTarget ? 100 : 0,
      remainingWeight: Math.round(remainingWhenEqual * 10) / 10,
      isCompleted: isAtTarget,
    };
  }

  const totalChange =
    Number.isFinite(target) && Number.isFinite(start)
      ? Math.abs(target - start)
      : 0;

  const currentChange =
    Number.isFinite(current) && Number.isFinite(start)
      ? Math.abs(current - start)
      : 0;

  const rawProgress =
    totalChange > 0 ? (currentChange / totalChange) * 100 : 0;

  const progress = Math.max(0, Math.min(rawProgress, 100));
  const remainingWeight =
    Number.isFinite(target) && Number.isFinite(current)
      ? Math.abs(target - current)
      : 0;
  const isCompleted = progress >= 100 - 1e-9;

  return {
    progress: Math.round(progress * 10) / 10, // Round to 1 decimal place
    remainingWeight: Math.round(remainingWeight * 10) / 10,
    isCompleted,
  };
}

export function getDaysRemaining(targetDate: string): number {
  const target = new Date(targetDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);

  const diffTime = target.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

export function getWeeksElapsed(startDate: string): number {
  const start = new Date(startDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  start.setHours(0, 0, 0, 0);

  const diffTime = today.getTime() - start.getTime();
  const diffWeeks = diffTime / (1000 * 60 * 60 * 24 * 7);

  return Math.max(0, Math.floor(diffWeeks));
}

// Goal status utilities
export function getGoalStatus(
  goals: WeightGoals,
): "on-track" | "ahead" | "behind" | "completed" {
  const { progress, isCompleted } = calculateGoalProgress(goals);

  if (isCompleted) return "completed";

  const weeksElapsed = getWeeksElapsed(goals.startDate);
  const totalWeeks = goals.calculatedWeeks;
  const expectedProgress =
    totalWeeks > 0 ? (weeksElapsed / totalWeeks) * 100 : 0;

  const progressDiff = progress - expectedProgress;

  if (progressDiff > 10) return "ahead";
  if (progressDiff < -10) return "behind";
  return "on-track";
}

export function getMotivationalMessage(
  status: ReturnType<typeof getGoalStatus>,
): string {
  switch (status) {
    case "completed": {
      return "Congratulations! You've reached your goal!";
    }
    case "ahead": {
      return "Great job! You're ahead of schedule!";
    }
    case "on-track": {
      return "Keep it up! You're right on track!";
    }
    case "behind": {
      return "Don't give up! Small consistent changes make a big difference!";
    }
    default: {
      return "Stay focused on your goal!";
    }
  }
}
