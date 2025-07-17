// Combined loader for goals route: fetches macroTarget, macroDailyTotals, and weightGoals
import { createNutritionProfile } from "@/features/settings/utils/calculations";
import { habitsLoader } from "@/loaders/habitsLoader";
import { apiService } from "@/utils/apiServices";

import { macroDataLoader } from "./macroDataLoader";
import { weightGoalsLoader } from "./weightGoalsLoader";

export const macroGoalsLoader = async () => {
  const [macroTargetResult, macroDataResult, weightGoalsResult, habitsResult] =
    await Promise.all([
      apiService.macros.getMacroTarget(),
      macroDataLoader(),
      weightGoalsLoader(),
      habitsLoader(),
    ]);

  return {
    macroTarget: macroTargetResult?.macroTarget ?? undefined,
    macroDailyTotals: macroDataResult?.macroDailyTotals ?? {
      protein: 0,
      carbs: 0,
      fats: 0,
      calories: 0,
    },
    weightGoals: weightGoalsResult?.weightGoals ?? undefined,
    weightLog: weightGoalsResult?.weightLog ?? [],
    weightGoalsError: weightGoalsResult?.error,
    habits: habitsResult?.habits ?? [],
    habitsError: habitsResult?.error,
  };
};

// Combined loader for home route: fetches macroTarget, macroData, and weightGoals
export const macroHomeLoader = async (options?: {
  search?: { limit?: string | number; offset?: string | number };
}) => {
  // Get limit/offset from search params, fallback to defaults
  const limit = options?.search?.limit ? Number(options.search.limit) : 20;
  const offset = options?.search?.offset ? Number(options.search.offset) : 0;

  const [macroTargetResult, macroDataResult, weightGoalsResult] =
    await Promise.all([
      apiService.macros.getMacroTarget(),
      macroDataLoader({ limit, offset }),
      weightGoalsLoader(),
    ]);
  const result = {
    macroTarget: macroTargetResult?.macroTarget ?? undefined,
    ...macroDataResult,
    weightGoals: weightGoalsResult?.weightGoals ?? undefined,
    weightLog: weightGoalsResult?.weightLog ?? [],
    weightGoalsError: weightGoalsResult?.error,
  };
  // Return a new shallow copy to ensure a new object reference
  return { ...result };
};

export const macroTargetLoader = async () => {
  try {
    const response = await apiService.macros.getMacroTarget();
    return { macroTarget: response?.macroTarget ?? undefined };
  } catch (error: any) {
    return {
      macroTarget: undefined,
      error: error?.message || "Failed to load macro target",
    };
  }
};
