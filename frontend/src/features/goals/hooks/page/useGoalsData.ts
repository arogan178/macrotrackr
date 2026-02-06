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

function toUserSettings(user: UserDetailsResponse | null | undefined): UserSettings | undefined {
  if (!user) return undefined;
  return {
    ...user,
    dateOfBirth: user.dateOfBirth ?? "",
  } as UserSettings;
}

export function useGoalsData() {
  const loaderData: {
    macroDailyTotals?: { protein: number; carbs: number; fats: number; calories: number };
    weightGoals?: WeightGoalsResponse;
    weightLog?: unknown;
    weightGoalsError?: string;
  } = useLoaderData({ from: goalsRoute.id }) || {};

  const { data: user } = useUser();
  const safeUserSettings = toUserSettings(user);

  const { data: macroTarget } = useMacroTarget();
  const { data: liveMacroDailyTotals } = useMacroDailyTotals();

  const initialMacroDailyTotals = loaderData.macroDailyTotals || {
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
  };

  const macroDailyTotals = liveMacroDailyTotals || initialMacroDailyTotals;

  const nutritionProfile = safeUserSettings ? createNutritionProfile(safeUserSettings) : undefined;

  const { data: habits = [], isLoading: habitsLoading } = useHabits();
  
  // With cache persistence, query data is available immediately after first load
  // placeholderData: 'previousData' in useWeightGoals keeps showing old data during refetch
  const { data: weightGoalsFromQuery } = useWeightGoals();
  
  // Use query data preferentially, fallback to loader data for initial SSR/hydration
  const currentWeightGoals = weightGoalsFromQuery ?? loaderData.weightGoals;
  const safeTargetWeight = currentWeightGoals?.targetWeight || user?.weight || 0;

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
  };
}