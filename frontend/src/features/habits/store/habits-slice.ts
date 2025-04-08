import { StateCreator } from "zustand";
import { HabitGoal, HabitGoalFormValues, HabitsState } from "../types";
import { apiService } from "@/utils/api-service";
import { getErrorMessage } from "@/utils/error-handling";
import { generateId } from "@/utils/id-generator";

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
  error: null,

  // --- Fetch Actions ---
  fetchHabits: async () => {
    set({ isLoading: true, error: null });
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
    set({ isLoading: true, error: null });
    const fullGet = get as () => FullState;

    try {
      const newHabit: HabitGoal = {
        id: generateId(),
        title: values.title,
        iconName: values.iconName,
        current: 0,
        target: values.target,
        progress: 0,
        accentColor: values.accentColor,
        isComplete: false,
        createdAt: new Date().toISOString(),
      };

      await apiService.habits.saveHabit(newHabit);

      // Update local state
      const currentHabits = get().habits;
      set({
        habits: [...currentHabits, newHabit],
        isLoading: false,
      });

      fullGet().addNotification?.({
        message: "Habit created successfully!",
        type: "success",
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error adding habit:", error);
      set({ error: errorMessage, isLoading: false });

      fullGet().addNotification?.({
        message: `Failed to create habit: ${errorMessage}`,
        type: "error",
      });
    }
  },

  // --- Update Action ---
  updateHabit: async (id: string, values: HabitGoalFormValues) => {
    set({ isLoading: true, error: null });
    const fullGet = get as () => FullState;

    try {
      const currentHabits = get().habits;
      const habitIndex = currentHabits.findIndex(
        (habit: HabitGoal) => habit.id === id
      );

      if (habitIndex === -1) {
        throw new Error("Habit not found");
      }

      const existingHabit = currentHabits[habitIndex];
      const updatedHabit: HabitGoal = {
        ...existingHabit,
        title: values.title,
        iconName: values.iconName,
        target: values.target,
        accentColor: values.accentColor,
        // Recalculate progress based on the new target
        progress: Math.min(
          100,
          Math.round((existingHabit.current / values.target) * 100)
        ),
      };

      await apiService.habits.updateHabit(id, updatedHabit);

      // Update local state
      const updatedHabits = [...currentHabits];
      updatedHabits[habitIndex] = updatedHabit;

      set({
        habits: updatedHabits,
        isLoading: false,
      });

      fullGet().addNotification?.({
        message: "Habit updated successfully!",
        type: "success",
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error updating habit:", error);
      set({ error: errorMessage, isLoading: false });

      fullGet().addNotification?.({
        message: `Failed to update habit: ${errorMessage}`,
        type: "error",
      });
    }
  },

  // --- Increment Progress Action ---
  incrementHabitProgress: async (id: string) => {
    set({ isLoading: true, error: null });
    const fullGet = get as () => FullState;

    try {
      const currentHabits = get().habits;
      const habitIndex = currentHabits.findIndex(
        (habit: HabitGoal) => habit.id === id
      );

      if (habitIndex === -1 || currentHabits[habitIndex].isComplete) {
        throw new Error("Habit not found or already complete");
      }

      const habit = currentHabits[habitIndex];
      const newCurrent = Math.min(habit.target, habit.current + 1);
      const newProgress = Math.round((newCurrent / habit.target) * 100);
      const isComplete = newCurrent >= habit.target;

      const updatedHabit: HabitGoal = {
        ...habit,
        current: newCurrent,
        progress: newProgress,
        isComplete,
        completedAt: isComplete ? new Date().toISOString() : undefined,
      };

      await apiService.habits.updateHabit(id, updatedHabit);

      // Update local state
      const updatedHabits = [...currentHabits];
      updatedHabits[habitIndex] = updatedHabit;

      set({
        habits: updatedHabits,
        isLoading: false,
      });

      if (isComplete) {
        fullGet().addNotification?.({
          message: `🎉 Congratulations! You've completed your ${habit.title}!`,
          type: "success",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error incrementing habit progress:", error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  // --- Complete Habit Action ---
  completeHabit: async (id: string) => {
    set({ isLoading: true, error: null });
    const fullGet = get as () => FullState;

    try {
      const currentHabits = get().habits;
      const habitIndex = currentHabits.findIndex(
        (habit: HabitGoal) => habit.id === id
      );

      if (habitIndex === -1 || currentHabits[habitIndex].isComplete) {
        throw new Error("Habit not found or already complete");
      }

      const habit = currentHabits[habitIndex];
      const updatedHabit: HabitGoal = {
        ...habit,
        current: habit.target,
        progress: 100,
        isComplete: true,
        completedAt: new Date().toISOString(),
      };

      await apiService.habits.updateHabit(id, updatedHabit);

      // Update local state
      const updatedHabits = [...currentHabits];
      updatedHabits[habitIndex] = updatedHabit;

      set({
        habits: updatedHabits,
        isLoading: false,
      });

      fullGet().addNotification?.({
        message: `🎉 Congratulations! You've completed your ${habit.title}!`,
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
    set({ isLoading: true, error: null });
    const fullGet = get as () => FullState;

    try {
      await apiService.habits.deleteHabit(id);

      // Update local state
      const currentHabits = get().habits;
      const updatedHabits = currentHabits.filter(
        (habit: HabitGoal) => habit.id !== id
      );

      set({
        habits: updatedHabits,
        isLoading: false,
      });

      fullGet().addNotification?.({
        message: "Habit deleted successfully",
        type: "info",
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error deleting habit:", error);
      set({ error: errorMessage, isLoading: false });
    }
  },

  // --- Reset All Habits Action ---
  resetHabits: async () => {
    set({ isLoading: true, error: null });
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
  clearError: () => set({ error: null }),
});
