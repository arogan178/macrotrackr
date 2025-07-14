// Combined loader for goals route: fetches both macroTarget and macroDailyTotals
export const macroGoalsLoader = async () => {
  const [macroTargetResult, macroDataResult] = await Promise.all([
    apiService.macros.getMacroTarget(),
    macroDataLoader(),
  ]);
  return {
    macroTarget: macroTargetResult?.macroTarget ?? null,
    macroDailyTotals: macroDataResult?.macroDailyTotals ?? {
      protein: 0,
      carbs: 0,
      fats: 0,
      calories: 0,
    },
  };
};
import { macroDataLoader } from "./macroDataLoader";
// Combined loader for home route: fetches both macroTarget and macroData
export const macroHomeLoader = async () => {
  const [macroTargetResult, macroDataResult] = await Promise.all([
    apiService.macros.getMacroTarget(),
    macroDataLoader(),
  ]);
  return {
    macroTarget: macroTargetResult?.macroTarget ?? null,
    ...macroDataResult,
  };
};
import { apiService } from "@/utils/apiServices";

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
