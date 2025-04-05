import { StateCreator } from "zustand";
import { HabitGoal, HabitGoalFormValues } from "../types";
import { apiService } from "@/utils/api-service";
import { getErrorMessage } from "@/utils/error-handling";
import { generateId } from "@/utils/id-generator";
// Define the slice interface
export interface HabitSlice {
  // State
  habitGoals: HabitGoal[] | null;
  isLoadingHabits: boolean;
  habitError: string | null;

  // Actions
  fetchHabitGoals: () => Promise<void>;
  addHabitGoal: (values: HabitGoalFormValues) => Promise<void>;
  updateHabitGoal: (id: string, values: HabitGoalFormValues) => Promise<void>;
  incrementHabitProgress: (id: string) => Promise<void>;
  completeHabitGoal: (id: string) => Promise<void>;
  deleteHabitGoal: (id: string) => Promise<void>;
  resetHabitGoals: () => Promise<void>;
  clearHabitError: () => void;
}

// Define the type for the full state for use with get()
type FullState = HabitSlice & {
  // Include methods from other slices if they are accessed via get()
  addNotification?: (notification: {
    message: string;
    type: "success" | "error" | "info" | "warning";
  }) => void;
};

export const createHabitSlice: StateCreator<
  HabitSlice & any,
  [],
  [],
  HabitSlice
> = (set, get) => ({
  // Initial State
  habitGoals: null,
  isLoadingHabits: false,
  habitError: null,

  // --- Fetch Actions ---
  fetchHabitGoals: async () => {
    set({ isLoadingHabits: true, habitError: null });
    try {
      const habits = await apiService.goals.getHabitGoals();
      set({ habitGoals: habits, isLoadingHabits: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error fetching habit goals:", error);
      set({ habitError: errorMessage, isLoadingHabits: false });
    }
  },

  // --- Add Action ---
  addHabitGoal: async (values: HabitGoalFormValues) => {
    set({ isLoadingHabits: true, habitError: null });
    const fullGet = get as () => FullState;

    try {
      const newHabit: HabitGoal = {
        id: generateId(), // Use a unique ID generator
        title: values.title,
        iconName: values.iconName,
        current: 0,
        target: values.target,
        progress: 0,
        accentColor: values.accentColor,
        isComplete: false,
        createdAt: new Date().toISOString(),
      };

      await apiService.goals.saveHabitGoal(newHabit);

      // Update local state
      const currentHabits = get().habitGoals || [];
      set({
        habitGoals: [...currentHabits, newHabit],
        isLoadingHabits: false,
      });

      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: "Habit goal created successfully!",
          type: "success",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error adding habit goal:", error);
      set({ habitError: errorMessage, isLoadingHabits: false });

      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: `Failed to create habit goal: ${errorMessage}`,
          type: "error",
        });
      }
    }
  },

  // --- Update Action ---
  updateHabitGoal: async (id: string, values: HabitGoalFormValues) => {
    set({ isLoadingHabits: true, habitError: null });
    const fullGet = get as () => FullState;

    try {
      const currentHabits = get().habitGoals || [];
      const habitIndex = currentHabits.findIndex((habit) => habit.id === id);

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

      await apiService.goals.updateHabitGoal(id, updatedHabit);

      // Update local state
      const updatedHabits = [...currentHabits];
      updatedHabits[habitIndex] = updatedHabit;

      set({
        habitGoals: updatedHabits,
        isLoadingHabits: false,
      });

      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: "Habit goal updated successfully!",
          type: "success",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error updating habit goal:", error);
      set({ habitError: errorMessage, isLoadingHabits: false });

      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: `Failed to update habit goal: ${errorMessage}`,
          type: "error",
        });
      }
    }
  },

  // --- Increment Progress Action ---
  incrementHabitProgress: async (id: string) => {
    set({ isLoadingHabits: true, habitError: null });
    const fullGet = get as () => FullState;

    try {
      const currentHabits = get().habitGoals || [];
      const habitIndex = currentHabits.findIndex((habit) => habit.id === id);

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

      await apiService.goals.updateHabitGoal(id, updatedHabit);

      // Update local state
      const updatedHabits = [...currentHabits];
      updatedHabits[habitIndex] = updatedHabit;

      set({
        habitGoals: updatedHabits,
        isLoadingHabits: false,
      });

      if (isComplete && fullGet().addNotification) {
        fullGet().addNotification({
          message: `🎉 Congratulations! You've completed your ${habit.title} goal!`,
          type: "success",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error incrementing habit progress:", error);
      set({ habitError: errorMessage, isLoadingHabits: false });
    }
  },

  // --- Complete Habit Action ---
  completeHabitGoal: async (id: string) => {
    set({ isLoadingHabits: true, habitError: null });
    const fullGet = get as () => FullState;

    try {
      const currentHabits = get().habitGoals || [];
      const habitIndex = currentHabits.findIndex((habit) => habit.id === id);

      if (habitIndex === -1 || currentHabits[habitIndex].isComplete) {
        throw new Error("Habit not found or already complete");
      }

      const habit = currentHabits[habitIndex];
      const updatedHabit: HabitGoal = {
        ...habit,
        current: habit.target, // Set to target value
        progress: 100,
        isComplete: true,
        completedAt: new Date().toISOString(),
      };

      await apiService.goals.updateHabitGoal(id, updatedHabit);

      // Update local state
      const updatedHabits = [...currentHabits];
      updatedHabits[habitIndex] = updatedHabit;

      set({
        habitGoals: updatedHabits,
        isLoadingHabits: false,
      });

      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: `🎉 Congratulations! You've completed your ${habit.title} goal!`,
          type: "success",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error completing habit goal:", error);
      set({ habitError: errorMessage, isLoadingHabits: false });
    }
  },

  // --- Delete Action ---
  deleteHabitGoal: async (id: string) => {
    set({ isLoadingHabits: true, habitError: null });
    const fullGet = get as () => FullState;

    try {
      await apiService.goals.deleteHabitGoal(id);

      // Update local state
      const currentHabits = get().habitGoals || [];
      const updatedHabits = currentHabits.filter((habit) => habit.id !== id);

      set({
        habitGoals: updatedHabits,
        isLoadingHabits: false,
      });

      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: "Habit goal deleted successfully",
          type: "info",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error deleting habit goal:", error);
      set({ habitError: errorMessage, isLoadingHabits: false });
    }
  },

  // --- Reset All Habits Action ---
  resetHabitGoals: async () => {
    set({ isLoadingHabits: true, habitError: null });
    try {
      await apiService.goals.resetHabitGoals();
      set({ habitGoals: [], isLoadingHabits: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error resetting habit goals:", error);
      set({ habitError: errorMessage, isLoadingHabits: false });
    }
  },

  // --- Clear Error Action ---
  clearHabitError: () => set({ habitError: null }),
});
