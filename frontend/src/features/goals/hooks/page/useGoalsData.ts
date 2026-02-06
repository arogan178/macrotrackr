import { useLoaderData } from "@tanstack/react-router";
import { useRef } from "react";

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
  const { data: weightGoalsFromQuery, isSuccess: weightGoalsQuerySuccess } = useWeightGoals();

  // Track if query has ever successfully loaded (even if data is null)
  const hasEverLoaded = useRef(false);
  if (weightGoalsQuerySuccess) {
    hasEverLoaded.current = true;
  }

  // Use query data if it has ever loaded, otherwise use loader data
  // This prevents falling back to loader data during refetch after mutations
  const currentWeightGoals = hasEverLoaded.current ? weightGoalsFromQuery : loaderData.weightGoals;
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