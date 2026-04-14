import { apiClient, type ApiError } from "@/api/core";
import {
  calculateCalorieTarget,
  calculateWeeklyChange,
  calculateWeeksToGoal,
} from "@/features/goals/calculations";
import type { WeightGoalFormValues } from "@/features/goals/types";

interface SetWeightGoalPayload {
  startingWeight: number;
  currentWeight: number | undefined;
  targetWeight: number | undefined;
  weightGoal: "lose" | "maintain" | "gain" | undefined;
  startDate: string | undefined;
  targetDate: string | undefined;
  calorieTarget: number | undefined;
  calculatedWeeks: number | undefined;
  weeklyChange: number | undefined;
  dailyChange: number | undefined;
}

interface WeightGoalUpsertPayload {
  goals: WeightGoalFormValues;
  tdee: number;
}

export interface WeightLogEntry {
  id: string;
  timestamp: string;
  weight: number;
}

export interface AddWeightLogPayload {
  timestamp: string;
  weight: number;
}

export const goalsApi = {
  /**
   * @throws {ApiError}
   */
  getWeightGoals: async (): Promise<SetWeightGoalPayload | undefined> => {
    try {
      const result = await apiClient.get<SetWeightGoalPayload | null>("/api/goals/weight");
      return result === null ? undefined : result;
    } catch (e) {
      throw e;
    }
  },

  /**
   * @throws {ApiError}
   */
  createWeightGoal: async ({
    goals,
    tdee,
  }: WeightGoalUpsertPayload) => {
    const startingWeight = goals.startingWeight ?? 0;
    const targetWeight = goals.targetWeight ?? startingWeight;
    const payload = {
      ...goals,
      calorieTarget:
        goals.calorieTarget ??
        calculateCalorieTarget(tdee, startingWeight, targetWeight),
      weeklyChange:
        goals.weeklyChange ??
        calculateWeeklyChange(startingWeight, targetWeight),
      calculatedWeeks:
        goals.calculatedWeeks ??
        calculateWeeksToGoal(startingWeight, targetWeight),
      dailyChange: goals.dailyChange ?? undefined,
    };

    return apiClient.post<unknown>("/api/goals/weight", payload);
  },

  /**
   * @throws {ApiError}
   */
  updateWeightGoal: async ({
    goals,
    tdee,
  }: WeightGoalUpsertPayload) => {
    const startingWeight = goals.startingWeight ?? 0;
    const targetWeight = goals.targetWeight ?? startingWeight;
    const payload = {
      calorieTarget:
        goals.calorieTarget ??
        calculateCalorieTarget(tdee, startingWeight, targetWeight),
      weeklyChange:
        goals.weeklyChange ??
        calculateWeeklyChange(startingWeight, targetWeight),
      calculatedWeeks:
        goals.calculatedWeeks ??
        calculateWeeksToGoal(startingWeight, targetWeight),
      dailyChange: goals.dailyChange ?? undefined,
      targetWeight: goals.targetWeight,
      weightGoal: goals.weightGoal,
      startDate: goals.startDate,
      targetDate: goals.targetDate,
    };

    return apiClient.put<unknown>("/api/goals/weight", payload);
  },

  /**
   * @throws {ApiError}
   */
  deleteWeightGoals: async () => {
    return apiClient.del<unknown>("/api/goals/weight");
  },

  /**
   * @throws {ApiError}
   */
  getWeightLog: async (): Promise<WeightLogEntry[]> => {
    return apiClient.get<WeightLogEntry[]>("/api/goals/weight-log");
  },

  /**
   * @throws {ApiError}
   */
  addWeightLogEntry: async (
    payload: AddWeightLogPayload,
  ): Promise<WeightLogEntry> => {
    const fullEntry = await apiClient.post<WeightLogEntry>("/api/goals/weight-log", payload);

    return {
      id: fullEntry.id,
      timestamp: fullEntry.timestamp,
      weight: fullEntry.weight,
    };
  },

  /**
   * @throws {ApiError}
   */
  deleteWeightLogEntry: async ({
    id,
  }: { id: string }): Promise<{ success: boolean; id: string }> => {
    return apiClient.del<{ success: boolean; id: string }>(`/api/goals/weight-log/${id}`);
  },
};
