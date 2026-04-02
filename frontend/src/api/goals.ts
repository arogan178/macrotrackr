import { API_BASE_URL, getHeaders, handleResponse } from "@/api/core";
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
  getWeightGoals: async (): Promise<SetWeightGoalPayload | undefined> => {
    const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
      headers: await getHeaders(false),
      credentials: "include",
    });
    const result = (await handleResponse(response)) as
      | SetWeightGoalPayload
      | undefined
      | null;

    return result === null ? undefined : result;
  },

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

    const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
      method: "POST",
      headers: await getHeaders(),
      body: JSON.stringify(payload),
      credentials: "include",
    });

    return handleResponse(response);
  },

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

    const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
      method: "PUT",
      headers: await getHeaders(),
      body: JSON.stringify(payload),
      credentials: "include",
    });

    return handleResponse(response);
  },

  deleteWeightGoals: async () => {
    const response = await fetch(`${API_BASE_URL}/api/goals/weight`, {
      method: "DELETE",
      headers: await getHeaders(false),
      credentials: "include",
    });

    return handleResponse(response);
  },

  getWeightLog: async (): Promise<WeightLogEntry[]> => {
    const response = await fetch(`${API_BASE_URL}/api/goals/weight-log`, {
      headers: await getHeaders(false),
      credentials: "include",
    });

    return (await handleResponse(response)) as WeightLogEntry[];
  },

  addWeightLogEntry: async (
    payload: AddWeightLogPayload,
  ): Promise<WeightLogEntry> => {
    const response = await fetch(`${API_BASE_URL}/api/goals/weight-log`, {
      method: "POST",
      headers: await getHeaders(),
      body: JSON.stringify(payload),
      credentials: "include",
    });
    const fullEntry = (await handleResponse(response)) as WeightLogEntry;

    return {
      id: fullEntry.id,
      timestamp: fullEntry.timestamp,
      weight: fullEntry.weight,
    };
  },

  deleteWeightLogEntry: async (
    id: string,
  ): Promise<{ success: boolean; id: string }> => {
    const response = await fetch(
      `${API_BASE_URL}/api/goals/weight-log/${id}`,
      {
        method: "DELETE",
        headers: await getHeaders(false),
        credentials: "include",
      },
    );

    return (await handleResponse(response)) as {
      success: boolean;
      id: string;
    };
  },
};
