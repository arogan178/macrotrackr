import { apiService } from "@/utils/apiServices";

import { macroDataLoader } from "./macroDataLoader";
import { weightGoalsLoader } from "./weightGoalsLoader";

// Combined loader for goals route: fetches macroTarget, macroDailyTotals, and weightGoals
import { createNutritionProfile } from "@/features/settings/utils/calculations";

export const macroGoalsLoader = async () => {
  const [
    macroTargetResult,
    macroDataResult,
    weightGoalsResult,
    userDetailsResult,
  ] = await Promise.all([
    apiService.macros.getMacroTarget(),
    macroDataLoader(),
    weightGoalsLoader(),
    apiService.user.getUserDetails(),
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
  };
};

// Combined loader for home route: fetches macroTarget, macroData, and weightGoals
export const macroHomeLoader = async () => {
  const [macroTargetResult, macroDataResult, weightGoalsResult] =
    await Promise.all([
      apiService.macros.getMacroTarget(),
      macroDataLoader(),
      weightGoalsLoader(),
    ]);
  return {
    macroTarget: macroTargetResult?.macroTarget ?? null,
    ...macroDataResult,
    weightGoals: weightGoalsResult?.weightGoals ?? undefined,
    weightLog: weightGoalsResult?.weightLog ?? [],
    weightGoalsError: weightGoalsResult?.error,
  };
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
