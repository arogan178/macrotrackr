import { StateCreator } from "zustand";

import { apiService } from "@/utils/apiServices";
import { getErrorMessage } from "@/utils/errorHandling";

import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants";
import { HabitGoal, HabitGoalFormValues, HabitsState } from "../types/types";
import {
  completeHabit,
  createNewHabit,
  incrementHabitProgress,
  updateHabitFromForm,
} from "../utils";

// Define the notification type
interface Notification {
  message: string;
  type: "success" | "error" | "info" | "warning";
}

// Define the slice interface
export interface HabitsSlice extends HabitsState {
  // Actions
  fetchHabits: () => Promise<void>;
  addHabit: (values: HabitGoalFormValues) => Promise<void>;
  updateHabit: (id: string, values: HabitGoalFormValues) => Promise<void>;
  incrementHabitProgress: (id: string) => Promise<void>;
  completeHabit: (id: string) => Promise<void>;
  deleteHabit: (id: string) => Promise<void>;
  resetHabits: () => Promise<void>;
  clearError: () => void;
}

// Define the type for the full state for use with get()
type FullState = HabitsSlice & {
  // Include methods from other slices if they are accessed via get()
  addNotification?: (notification: Notification) => void;
};

export const createHabitsSlice: StateCreator<
  HabitsSlice,
  [],
  [],
  HabitsSlice
> = (set, get) => ({
  // Initial State
  habits: [],
  isLoading: false,
  error: undefined,

  // --- Fetch Actions ---
  fetchHabits: async () => {
    set({ isLoading: true, error: undefined });
    try {
      const habits = await apiService.habits.getHabit();
      set({ habits, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error fetching habits:", error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  // --- Add Action ---
  addHabit: async (values: HabitGoalFormValues) => {
    set({ isLoading: true, error: undefined });
    const fullGet = get as () => FullState;

    try {
      const newHabit = createNewHabit(values);
      await apiService.habits.saveHabit(newHabit);

      // Update local state
      const currentHabits = get().habits;
      set({
        habits: [...currentHabits, newHabit],
        isLoading: false,
      });

      fullGet().addNotification?.({
        message: SUCCESS_MESSAGES.created,
        type: "success",
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error adding habit:", error);
      set({ error: errorMessage, isLoading: false });

      fullGet().addNotification?.({
        message: `${ERROR_MESSAGES.create}: ${errorMessage}`,
        type: "error",
      });
    }
  },
  // --- Update Action ---
  updateHabit: async (id: string, values: HabitGoalFormValues) => {
    set({ isLoading: true, error: undefined });
    const fullGet = get as () => FullState;

    try {
      const currentHabits = get().habits;
      const habitIndex = currentHabits.findIndex(
        (habit: HabitGoal) => habit.id === id,
      );

      if (habitIndex === -1) {
        throw new Error("Habit not found");
      }

      const existingHabit = currentHabits[habitIndex];

      // Prevent editing of completed habits
      if (existingHabit.isComplete) {
        throw new Error("Completed habits cannot be edited");
      }

      // Prevent decreasing the target below the current value
      if (values.target < existingHabit.current) {
        throw new Error("Target cannot be lower than current progress");
      }

      const updatedHabit = updateHabitFromForm(existingHabit, values);
      await apiService.habits.updateHabit(id, updatedHabit);

      // Update local state
      const updatedHabits = [...currentHabits];
      updatedHabits[habitIndex] = updatedHabit;

      set({
        habits: updatedHabits,
        isLoading: false,
      });

      fullGet().addNotification?.({
        message: SUCCESS_MESSAGES.updated,
        type: "success",
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error updating habit:", error);
      set({ error: errorMessage, isLoading: false });

      fullGet().addNotification?.({
        message: `${ERROR_MESSAGES.update}: ${errorMessage}`,
        type: "error",
      });
    }
  },
  // --- Increment Progress Action ---
  incrementHabitProgress: async (id: string) => {
    // Don't set global loading state to avoid full UI refresh
    set({ error: undefined });
    const fullGet = get as () => FullState;

    try {
      const currentHabits = get().habits;
      const habitIndex = currentHabits.findIndex(
        (habit: HabitGoal) => habit.id === id,
      );

      if (habitIndex === -1 || currentHabits[habitIndex].isComplete) {
        throw new Error("Habit not found or already complete");
      }

      const habit = currentHabits[habitIndex];
      const updatedHabit = incrementHabitProgress(habit);

      // Update local state FIRST (optimistic update)
      // This gives immediate visual feedback
      const updatedHabits = [...currentHabits];
      updatedHabits[habitIndex] = updatedHabit;

      set({
        habits: updatedHabits,
      });

      // Then update in the backend without blocking the UI
      await apiService.habits.updateHabit(id, updatedHabit);

      if (updatedHabit.isComplete && !habit.isComplete) {
        fullGet().addNotification?.({
          message: `🎉 Congratulations! You've completed your ${habit.title}!`,
          type: "success",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error incrementing habit progress:", error);

      // On error, revert to original state by refetching habits
      set({ error: errorMessage });
      get().fetchHabits();
    }
  },

  // --- Complete Habit Action ---
  completeHabit: async (id: string) => {
    set({ isLoading: true, error: undefined });
    const fullGet = get as () => FullState;

    try {
      const currentHabits = get().habits;
      const habitIndex = currentHabits.findIndex(
        (habit: HabitGoal) => habit.id === id,
      );

      if (habitIndex === -1 || currentHabits[habitIndex].isComplete) {
        throw new Error("Habit not found or already complete");
      }

      const habit = currentHabits[habitIndex];
      const updatedHabit = completeHabit(habit);

      await apiService.habits.updateHabit(id, updatedHabit);

      // Update local state
      const updatedHabits = [...currentHabits];
      updatedHabits[habitIndex] = updatedHabit;

      set({
        habits: updatedHabits,
        isLoading: false,
      });

      fullGet().addNotification?.({
        message: SUCCESS_MESSAGES.completed,
        type: "success",
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error completing habit:", error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  // --- Delete Action ---
  deleteHabit: async (id: string) => {
    // Remove global loading state change
    set({ error: undefined });
    const fullGet = get as () => FullState;
    const currentHabits = get().habits;
    const habitToDelete = currentHabits.find((habit) => habit.id === id);

    if (!habitToDelete) {
      console.warn("Attempted to delete non-existent habit:", id);
      return; // Habit already gone or never existed
    }

    // Optimistic Update: Remove locally first
    const updatedHabits = currentHabits.filter(
      (habit: HabitGoal) => habit.id !== id,
    );
    set({ habits: updatedHabits });

    try {
      // Attempt to delete from backend
      await apiService.habits.deleteHabit(id);

      // API call successful, notify user
      fullGet().addNotification?.({
        message: "Habit deleted successfully",
        type: "info",
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error deleting habit:", error);

      // Revert optimistic update on error by re-fetching
      set({ error: errorMessage });
      get().fetchHabits(); // Refetch to get the correct state

      fullGet().addNotification?.({
        message: `Failed to delete habit: ${errorMessage}`,
        type: "error",
      });
    }
  },

  // --- Reset All Habits Action ---
  resetHabits: async () => {
    set({ isLoading: true, error: undefined });
    try {
      await apiService.habits.resetHabit();
      set({ habits: [], isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error resetting habits:", error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  // --- Clear Error Action ---
  clearError: () => set({ error: undefined }),
});
