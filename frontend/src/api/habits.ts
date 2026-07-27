import { apiClient } from "@/api/core";
import type { HabitAccentColor } from "@/types/habit";

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
  isComplete?: boolean;
  createdAt: string;
  completedAt?: string;
}

export const habitsApi = {
  /**
   * @throws {ApiError}
   */
  getHabits: async (): Promise<HabitGoalPayload[]> => {
    return apiClient.get<HabitGoalPayload[]>("/api/habits");
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
  resetHabit: async (): Promise<{ success: boolean; count: number }> => {
    return apiClient.del<{ success: boolean; count: number }>("/api/habits", { headers: true });
  },
};
