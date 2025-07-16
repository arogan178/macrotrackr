import { apiService } from "@/utils/apiServices";

import { macroDataLoader } from "./macroDataLoader";
import { weightGoalsLoader } from "./weightGoalsLoader";
import { habitsLoader } from "@/features/habits/loaders/habitsLoader";

// Combined loader for goals route: fetches macroTarget, macroDailyTotals, and weightGoals
import { createNutritionProfile } from "@/features/settings/utils/calculations";

export const macroGoalsLoader = async () => {
  const [
    macroTargetResult,
    macroDataResult,
    weightGoalsResult,
    userDetailsResult,
    habitsResult,
  ] = await Promise.all([
    apiService.macros.getMacroTarget(),
    macroDataLoader(),
    weightGoalsLoader(),
    apiService.user.getUserDetails(),
    habitsLoader(),
  ]);

  // Compute nutritionProfile from user details
  let nutritionProfile = null;
  if (userDetailsResult) {
    try {
      // Map userDetailsResult to UserSettings shape
      const userSettings = {
        ...userDetailsResult,
        dateOfBirth: userDetailsResult.dateOfBirth ?? "",
        height: userDetailsResult.height ?? 0,
        weight: userDetailsResult.weight ?? 0,
        gender: (userDetailsResult.gender as "" | "male" | "female" | undefined) ?? "male",
        activityLevel: userDetailsResult.activityLevel ?? 1,
      };
      nutritionProfile = createNutritionProfile(userSettings);
    } catch {
      nutritionProfile = null;
    }
  }

  return {
    macroTarget: macroTargetResult?.macroTarget ?? null,
    macroDailyTotals: macroDataResult?.macroDailyTotals ?? {
      protein: 0,
      carbs: 0,
      fats: 0,
      calories: 0,
    },
    weightGoals: weightGoalsResult?.weightGoals ?? undefined,
    weightLog: weightGoalsResult?.weightLog ?? [],
    weightGoalsError: weightGoalsResult?.error,
    nutritionProfile,
    habits: habitsResult?.habits ?? [],
    habitsError: habitsResult?.error,
  };
};

// Combined loader for home route: fetches macroTarget, macroData, and weightGoals
export const macroHomeLoader = async (opts?: { search?: { limit?: string | number; offset?: string | number } }) => {
  // Get limit/offset from search params, fallback to defaults
  const limit = opts?.search?.limit ? Number(opts.search.limit) : 20;
  const offset = opts?.search?.offset ? Number(opts.search.offset) : 0;

  const [macroTargetResult, macroDataResult, weightGoalsResult] =
    await Promise.all([
      apiService.macros.getMacroTarget(),
      macroDataLoader({ limit, offset }),
      weightGoalsLoader(),
    ]);
  const result = {
    macroTarget: macroTargetResult?.macroTarget ?? null,
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
    return { macroTarget: response?.macroTarget ?? null };
  } catch (error: any) {
    return {
      macroTarget: null,
      error: error?.message || "Failed to load macro target",
    };
  }
};
