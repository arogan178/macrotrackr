import { api, unwrap } from "@/api/core";
import type { WeightGoalFormValues } from "@/features/goals/types";
import {
  calculateCalorieTarget,
  calculateWeeklyChange,
  calculateWeeksToGoal,
} from "@/utils/nutritionCalculations";

interface SetWeightGoalPayload {
  startingWeight: number | null;
  currentWeight: number | null;
  targetWeight: number | null;
  weightGoal: "lose" | "maintain" | "gain" | null;
  startDate: string | null;
  targetDate: string | null;
  calorieTarget: number | null;
  calculatedWeeks: number | null;
  weeklyChange: number | null;
  dailyChange: number | null;
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
    const result: SetWeightGoalPayload | null = await unwrap(
      api.api.goals.weight.get(),
    );

    return result ?? undefined;
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
      startingWeight,
      targetWeight: goals.targetWeight ?? null,
      weightGoal: goals.weightGoal ?? null,
      startDate: goals.startDate ?? null,
      targetDate: goals.targetDate ?? null,
      calorieTarget:
        goals.calorieTarget ??
        calculateCalorieTarget(tdee, startingWeight, targetWeight),
      weeklyChange:
        goals.weeklyChange ??
        calculateWeeklyChange(startingWeight, targetWeight),
      calculatedWeeks:
        goals.calculatedWeeks ??
        calculateWeeksToGoal(startingWeight, targetWeight),
      dailyChange: goals.dailyChange ?? null,
    };

    return unwrap(api.api.goals.weight.post(payload));
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
      dailyChange: goals.dailyChange ?? null,
      targetWeight: goals.targetWeight ?? null,
      weightGoal: goals.weightGoal ?? null,
      startDate: goals.startDate ?? null,
      targetDate: goals.targetDate ?? null,
    };

    return unwrap(api.api.goals.weight.put(payload));
  },

  /**
   * @throws {ApiError}
   */
  deleteWeightGoals: async () => {
    return unwrap(api.api.goals.weight.delete());
  },

  /**
   * @throws {ApiError}
   */
  getWeightLog: async (): Promise<WeightLogEntry[]> => {
    return unwrap(api.api.goals["weight-log"].get());
  },

  /**
   * @throws {ApiError}
   */
  addWeightLogEntry: async (
    payload: AddWeightLogPayload,
  ): Promise<WeightLogEntry> => {
    const fullEntry = await unwrap(
      api.api.goals["weight-log"].post(payload),
    );

    return {
      id: fullEntry.id,
      timestamp: fullEntry.timestamp,
      weight: fullEntry.weight,
    };
  },

  /**
   * @throws {ApiError}
   */
  updateWeightLogEntry: async ({
    id,
    timestamp,
    weight,
  }: WeightLogEntry): Promise<WeightLogEntry> => {
    return unwrap(
      api.api.goals["weight-log"]({ id }).put({ timestamp, weight }),
    );
  },

  /**
   * @throws {ApiError}
   */
  deleteWeightLogEntry: async (
    idOrParameters: string | { id: string },
  ): Promise<{ success: boolean; id: string }> => {
    const id = typeof idOrParameters === "object" && idOrParameters !== null ? idOrParameters.id : idOrParameters;

    return unwrap(api.api.goals["weight-log"]({ id }).delete());
  },
};
