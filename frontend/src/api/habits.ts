import { apiClient } from "@/api/core";
import type { HabitAccentColor, HabitFrequency } from "@/types/habit";

export interface HabitGoalPayload {
  id: string;
  title: string;
  iconName: string;
  current: number;
  target: number;
  progress: number;
  accentColor?:
    | "indigo"
    | "blue"
    | "cyan"
    | "teal"
    | "green"
    | "lime"
    | "yellow"
    | "orange"
    | "red"
    | "pink"
    | "purple";
  frequency?: HabitFrequency;
  isComplete?: boolean;
  createdAt: string;
  completedAt?: string;
}

export interface HabitGoalUpdatePayload {
  title: string;
  iconName: string;
  current: number;
  target: number;
  accentColor?: HabitAccentColor;
  frequency?: HabitFrequency;
  isComplete?: boolean;
  createdAt: string;
  completedAt?: string;
}

export type HabitProgressAction = "increment" | "decrement" | "reset" | "complete";

export const habitsApi = {
  /**
   * @throws {ApiError}
   */
  getHabits: async (date: string): Promise<HabitGoalPayload[]> => {
    return apiClient.get<HabitGoalPayload[]>(`/api/habits?date=${date}`);
  },

  /**
   * @throws {ApiError}
   */
  saveHabit: async (habitGoal: HabitGoalPayload): Promise<HabitGoalPayload> => {
    return apiClient.post<HabitGoalPayload>("/api/habits", habitGoal);
  },

  /**
   * @throws {ApiError}
   */
  updateHabit: async (
    idOrParameters: string | { id: string; data: HabitGoalUpdatePayload },
    dataPayload?: HabitGoalUpdatePayload,
  ): Promise<HabitGoalPayload> => {
    let id: string;
    let data: HabitGoalUpdatePayload;

    if (typeof idOrParameters === "object" && idOrParameters !== null) {
      id = idOrParameters.id;
      data = idOrParameters.data;
    } else {
      id = idOrParameters;
      data = dataPayload!;
    }

    return apiClient.put<HabitGoalPayload>(`/api/habits/${id}`, data);
  },

  /**
   * @throws {ApiError}
   */
  deleteHabit: async (
    idOrParameters: string | { id: string },
  ): Promise<{ success: boolean; id: string }> => {
    const id = typeof idOrParameters === "object" && idOrParameters !== null ? idOrParameters.id : idOrParameters;

    return apiClient.del<{ success: boolean; id: string }>(`/api/habits/${id}`);
  },

  /**
   * @throws {ApiError}
   */
  updateHabitProgress: async (
    id: string,
    action: HabitProgressAction,
    date: string,
  ): Promise<HabitGoalPayload> => {
    return apiClient.post<HabitGoalPayload>(`/api/habits/${id}/progress`, {
      action,
      date,
    });
  },
};
