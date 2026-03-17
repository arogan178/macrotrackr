import { API_BASE_URL, getHeadersAsync, handleResponse } from "@/api/core";
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
  getHabits: async (): Promise<HabitGoalPayload[]> => {
    const response = await fetch(`${API_BASE_URL}/api/habits`, {
      headers: await getHeadersAsync(false),
      credentials: "include",
    });

    return (await handleResponse(response)) as HabitGoalPayload[];
  },

  saveHabit: async (habitGoal: HabitGoalPayload): Promise<HabitGoalPayload> => {
    const response = await fetch(`${API_BASE_URL}/api/habits`, {
      method: "POST",
      headers: await getHeadersAsync(),
      body: JSON.stringify(habitGoal),
      credentials: "include",
    });

    return (await handleResponse(response)) as HabitGoalPayload;
  },

  updateHabit: async (
    id: string,
    habitGoal: HabitGoalUpdatePayload,
  ): Promise<HabitGoalPayload> => {
    const response = await fetch(`${API_BASE_URL}/api/habits/${id}`, {
      method: "PUT",
      headers: await getHeadersAsync(),
      body: JSON.stringify(habitGoal),
      credentials: "include",
    });

    return (await handleResponse(response)) as HabitGoalPayload;
  },

  deleteHabit: async (id: string): Promise<{ success: boolean; id: string }> => {
    const response = await fetch(`${API_BASE_URL}/api/habits/${id}`, {
      method: "DELETE",
      headers: await getHeadersAsync(),
      credentials: "include",
    });

    return (await handleResponse(response)) as { success: boolean; id: string };
  },

  resetHabit: async (): Promise<{ success: boolean; count: number }> => {
    const response = await fetch(`${API_BASE_URL}/api/habits`, {
      method: "DELETE",
      headers: await getHeadersAsync(),
      credentials: "include",
    });

    return (await handleResponse(response)) as { success: boolean; count: number };
  },
};
