import { api, unwrap } from "@/api/core";
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
    return unwrap(api.api.habits.get({ query: { date } }));
  },

  /**
   * @throws {ApiError}
   */
  saveHabit: async (habitGoal: HabitGoalPayload): Promise<HabitGoalPayload> => {
    return unwrap(api.api.habits.post(habitGoal));
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

    return unwrap(api.api.habits({ id }).put(data));
  },

  /**
   * @throws {ApiError}
   */
  deleteHabit: async (
    idOrParameters: string | { id: string },
  ): Promise<{ success: boolean; id: string }> => {
    const id = typeof idOrParameters === "object" && idOrParameters !== null ? idOrParameters.id : idOrParameters;

    return unwrap(api.api.habits({ id }).delete());
  },

  /**
   * @throws {ApiError}
   */
  updateHabitProgress: async (
    id: string,
    action: HabitProgressAction,
    date: string,
  ): Promise<HabitGoalPayload> => {
    return unwrap(api.api.habits({ id }).progress.post({ action, date }));
  },
};
