import { useLoaderData } from "@tanstack/react-router";

import { goalsRoute } from "@/AppRouter";
import type { WeightGoalsResponse } from "@/features/goals/types";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useWeightGoals } from "@/hooks/queries/useGoals";
import { useHabits } from "@/hooks/queries/useHabits";
import { useMacroDailyTotals, useMacroTarget } from "@/hooks/queries/useMacroQueries";
import type { UserSettings } from "@/types/user";
import type { UserDetailsResponse } from "@/utils/apiServices";
import { createNutritionProfile } from "@/utils/userConstants";

interface GoalsLoaderData {
  macroDailyTotals?: { protein: number; carbs: number; fats: number; calories: number };
  weightGoals?: WeightGoalsResponse;
  weightLog?: unknown;
  weightGoalsError?: string;
}

// Transform UserDetailsResponse to UserSettings with required fields
const toUserSettings = (user: UserDetailsResponse | null | undefined): UserSettings | undefined => {
  if (!user) return undefined;
  return {
    ...user,
    dateOfBirth: user.dateOfBirth ?? "",
  };
};

export function useGoalsData() {
  const loaderData = useLoaderData({ from: goalsRoute.id }) as GoalsLoaderData || {};

  const { data: user, isError: isUserError, error: userError } = useUser();
  const safeUserSettings = toUserSettings(user);

  const { data: macroTarget } = useMacroTarget();
  const { data: liveMacroDailyTotals } = useMacroDailyTotals();

  const macroDailyTotals = liveMacroDailyTotals ?? loaderData.macroDailyTotals ?? DEFAULT_MACRO_TOTALS;
  const nutritionProfile = safeUserSettings ? createNutritionProfile(safeUserSettings) : undefined;

  const { 
    data: habits = [], 
    isLoading: habitsLoading, 
    isError: isHabitsError, 
    error: habitsError 
  } = useHabits();

  const { 
    data: weightGoalsFromQuery, 
    isError: isWeightGoalsError, 
    error: weightGoalsError 
  } = useWeightGoals();

  const currentWeightGoals = weightGoalsFromQuery ?? loaderData.weightGoals;
  const safeTargetWeight = currentWeightGoals?.targetWeight ?? user?.weight ?? 0;

  // Aggregate error states
  const hasErrors = isUserError || isWeightGoalsError || isHabitsError;
  const errors = {
    user: isUserError ? userError : null,
    weightGoals: isWeightGoalsError ? weightGoalsError : null,
    habits: isHabitsError ? habitsError : null,
  };

  return {
    loaderData,
    user,
    safeUserSettings,
    macroTarget,
    macroDailyTotals,
    nutritionProfile,
    habits,
    habitsLoading,
    currentWeightGoals,
    safeTargetWeight,
    hasErrors,
    errors,
  };
}
