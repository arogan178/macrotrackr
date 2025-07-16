// Loader to fetch habits for TanStack Router routes
import { apiService } from "@/utils/apiServices";
import { getErrorMessage } from "@/utils/errorHandling";

import type { HabitGoal } from "../types/types";

export async function habitsLoader() {
  try {
    const habits: HabitGoal[] = await apiService.habits.getHabit();
    return { habits, error: undefined };
  } catch (error) {
    const errorMessage = getErrorMessage(error);
    return { habits: [], error: errorMessage };
  }
}
