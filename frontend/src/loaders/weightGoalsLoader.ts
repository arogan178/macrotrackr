// Loader to fetch weight goals and weight log for TanStack Router routes

import { WeightGoals } from "@/types/goal";
import { apiService, WeightLogEntry } from "@/utils/apiServices";
import { getErrorMessage } from "@/utils/errorHandling";

export async function weightGoalsLoader() {
  try {
    // Fetch weight goals and weight log in parallel
    const [weightGoalsData, weightLog] = await Promise.all([
      apiService.goals.getWeightGoals(),
      apiService.goals.getWeightLog(),
    ]);

    let goalsWithCurrentWeight: WeightGoals | undefined;

    if (weightGoalsData) {
      const latestWeight =
        weightLog.length > 0
          ? weightLog.at(-1).weight
          : weightGoalsData.startingWeight;

      goalsWithCurrentWeight = {
        ...weightGoalsData,
        currentWeight: latestWeight,
        targetWeight:
          weightGoalsData.targetWeight || weightGoalsData.startingWeight,
        weightGoal: (weightGoalsData.weightGoal || "maintain") as
          | "lose"
          | "maintain"
          | "gain",
        startDate:
          weightGoalsData.startDate || new Date().toISOString().split("T")[0],
        targetDate:
          weightGoalsData.targetDate || new Date().toISOString().split("T")[0],
        calorieTarget: weightGoalsData.calorieTarget || 2000,
        calculatedWeeks: weightGoalsData.calculatedWeeks || 1,
        weeklyChange: weightGoalsData.weeklyChange || 0,
        dailyChange: weightGoalsData.dailyChange || 0,
      };
    }

    return {
      weightGoals: goalsWithCurrentWeight,
      weightLog: Array.isArray(weightLog) ? weightLog : [],
      error: undefined,
    };
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    return {
      weightGoals: undefined,
      weightLog: [],
      error: errorMessage,
    };
  }
}
