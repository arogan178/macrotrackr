import { StateCreator } from "zustand";
import { WeightGoals, WeightGoalFormValues } from "../types";
import { CALORIE_ADJUSTMENT_FACTORS } from "../constants";
import {
  apiService,
  WeightLogEntry,
  AddWeightLogPayload,
} from "@/utils/api-service";
import { getErrorMessage } from "@/utils/error-handling";

// Define the slice interface
export interface GoalsSlice {
  // State
  weightGoals: WeightGoals | null;
  weightLog: WeightLogEntry[]; // NEW: Add weight log state
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  fetchWeightGoals: () => Promise<void>;
  setWeightGoals: (goals: WeightGoals | null) => void;
  createWeightGoal: (
    formValues: WeightGoalFormValues,
    tdee: number
  ) => Promise<void>;
  updateWeightGoalField: <K extends keyof WeightGoals>(
    key: K,
    value: WeightGoals[K]
  ) => Promise<void>;
  deleteWeightGoal: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetGoals: () => Promise<void>;

  // NEW: Weight Log Actions
  fetchWeightLog: () => Promise<void>;
  addWeightLogEntry: (payload: AddWeightLogPayload) => Promise<void>;
  deleteWeightLogEntry: (id: string) => Promise<void>;
}

// Define the type for the full state for use with get()
type FullGoalsState = GoalsSlice & {
  // Include methods from other slices if they are accessed via get()
  addNotification?: (notification: {
    message: string;
    type: "success" | "error" | "info" | "warning";
  }) => void;

  // Reference to habits slice actions for coordination
  resetHabits?: () => Promise<void>;

  // Reference to user slice action
  updateCurrentUserWeight?: (newWeight: number) => void;
};

export const createGoalsSlice: StateCreator<GoalsSlice, [], [], GoalsSlice> = (
  set,
  get
) => ({
  // Initial State
  weightGoals: null,
  weightLog: [], // NEW: Initialize weight log state
  isLoading: false,
  isSaving: false,
  error: null,

  // --- Fetch Actions ---
  fetchWeightGoals: async () => {
    set({ isLoading: true, error: null });
    const fullGet = get as () => FullGoalsState;
    try {
      const weightGoalsData = await apiService.goals.getWeightGoals();
      set({ weightGoals: weightGoalsData, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error fetching weight goals:", error);
      set({ isLoading: false, error: errorMessage });
      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: `Failed to load weight goals: ${errorMessage}`,
          type: "error",
        });
      }
    }
  },

  // --- Set Actions ---
  setWeightGoals: (goals) => set({ weightGoals: goals, error: null }),

  // --- Create/Update Actions ---
  createWeightGoal: async (formValues, tdee) => {
    set({ isSaving: true, error: null });
    const fullGet = get as () => FullGoalsState;
    try {
      const {
        currentWeight,
        targetWeight,
        startDate,
        targetDate,
        calorieTarget: customCalorieTarget,
        weeklyChange: customWeeklyChange,
        calculatedWeeks: customCalculatedWeeks,
        weightGoal: customWeightGoal,
      } = formValues;

      let weightGoal = customWeightGoal || "maintain";
      if (!customWeightGoal && currentWeight && targetWeight) {
        if (targetWeight < currentWeight) weightGoal = "lose";
        else if (targetWeight > currentWeight) weightGoal = "gain";
      }

      const today = new Date();
      const formattedToday = today.toISOString().split("T")[0];

      const calorieTarget =
        customCalorieTarget ??
        tdee +
          (CALORIE_ADJUSTMENT_FACTORS[
            weightGoal as keyof typeof CALORIE_ADJUSTMENT_FACTORS
          ] || 0);

      let calculatedWeeks = customCalculatedWeeks ?? 1;
      let weeklyChange = customWeeklyChange ?? 0;
      let dailyChange = 0;

      if (
        (calculatedWeeks <= 1 || weeklyChange === 0) &&
        targetDate &&
        currentWeight &&
        targetWeight
      ) {
        const targetDateObj = new Date(targetDate);
        const diffTime = Math.max(0, targetDateObj.getTime() - today.getTime());
        calculatedWeeks = Math.max(
          1,
          Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
        );
        const weightDifference = Math.abs(targetWeight - currentWeight);
        weeklyChange =
          calculatedWeeks > 0 ? weightDifference / calculatedWeeks : 0;
      }
      if (
        weeklyChange &&
        weightGoal !== "maintain" &&
        currentWeight &&
        targetWeight
      ) {
        const calorieChangePerKg = 7700;
        const totalCalorieDiff =
          (targetWeight - currentWeight) * calorieChangePerKg;
        const totalDays = calculatedWeeks * 7;
        dailyChange = totalDays > 0 ? totalCalorieDiff / totalDays : 0;
      } else {
        dailyChange = tdee - calorieTarget;
      }

      const weightGoalsPayload: WeightGoals = {
        currentWeight,
        targetWeight,
        weightGoal,
        startDate: startDate || formattedToday,
        targetDate: targetDate || null,
        calorieTarget: calorieTarget,
        calculatedWeeks,
        weeklyChange,
        dailyChange,
      };

      const savedWeightGoal = await apiService.goals.saveWeightGoals(
        weightGoalsPayload
      );

      set({ weightGoals: savedWeightGoal, isSaving: false, error: null });

      // NEW: Add initial weight log entry if currentWeight is provided
      if (weightGoalsPayload.currentWeight !== null) {
        const initialLogPayload: AddWeightLogPayload = {
          date:
            weightGoalsPayload.startDate ||
            new Date().toISOString().split("T")[0],
          weight: weightGoalsPayload.currentWeight,
        };
        // Call addWeightLogEntry internally, but don't set saving state again
        // Error handling for this initial log is less critical, maybe just log it
        try {
          await get().addWeightLogEntry(initialLogPayload);
          console.log("Initial weight log entry added.");
        } catch (logError) {
          console.error("Failed to add initial weight log entry:", logError);
          // Optionally notify user, but goal creation was successful
        }
      }

      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: "Weight goal saved successfully!",
          type: "success",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error creating weight goal:", error);
      set({ error: errorMessage, isSaving: false });
      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: `Failed to save weight goal: ${errorMessage}`,
          type: "error",
        });
      }
    }
  },

  updateWeightGoalField: async (key, value) => {
    const currentWeightGoals = get().weightGoals;
    if (!currentWeightGoals) {
      console.warn("Cannot update field, no current weight goals exist.");
      return;
    }
    if (currentWeightGoals[key] === value) {
      return;
    }

    set({ isSaving: true, error: null });
    const fullGet = get as () => FullGoalsState;

    const updatedWeightGoals = { ...currentWeightGoals, [key]: value };

    try {
      const savedWeightGoal = await apiService.goals.saveWeightGoals(
        updatedWeightGoals
      );
      set({ weightGoals: savedWeightGoal, isSaving: false, error: null });
      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: `Weight goal (${String(key)}) updated!`,
          type: "success",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error(`Error updating weight goal field ${String(key)}:`, error);
      set({ error: errorMessage, isSaving: false });
      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: `Failed to update ${String(key)}: ${errorMessage}`,
          type: "error",
        });
      }
    }
  },

  // --- Delete Action ---
  deleteWeightGoal: async () => {
    set({ isSaving: true, error: null });
    const fullGet = get as () => FullGoalsState;
    try {
      await apiService.goals.deleteWeightGoals(); // Call API service
      // NEW: Clear weight log when goal is deleted
      set({ weightGoals: null, weightLog: [], isSaving: false, error: null });

      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: "Weight goal deleted successfully!",
          type: "success",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error deleting weight goal:", error);
      set({ error: errorMessage, isSaving: false });
      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: `Failed to delete weight goal: ${errorMessage}`,
          type: "error",
        });
      }
    }
  },

  // --- State Management Actions ---
  setLoading: (loading) => set({ isLoading: loading }),
  setSaving: (saving) => set({ isSaving: saving }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  // --- Reset Action ---
  resetGoals: async () => {
    // NEW: Clear weight log on reset
    set({
      weightGoals: null,
      weightLog: [],
      error: null,
      isLoading: false,
      isSaving: false,
    });
    // Optionally, refetch or perform other cleanup
  },

  // --- NEW: Weight Log Actions ---
  fetchWeightLog: async () => {
    set({ isLoading: true, error: null });
    const fullGet = get as () => FullGoalsState;
    try {
      const logData = await apiService.goals.getWeightLog();
      // Ensure data is sorted by date descending (API should already do this, but good practice)
      const sortedLog = logData.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      set({ weightLog: sortedLog, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error fetching weight log:", error);
      set({ isLoading: false, error: errorMessage });
      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: `Failed to load weight log: ${errorMessage}`,
          type: "error",
        });
      }
    }
  },

  addWeightLogEntry: async (payload: AddWeightLogPayload) => {
    set({ isSaving: true, error: null });
    const fullGet = get as () => FullGoalsState;
    try {
      const savedEntry = await apiService.goals.addWeightLogEntry(payload);

      set((state) => ({
        // Add new entry and re-sort
        weightLog: [...(state.weightLog || []), savedEntry].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        ),
        // Update current weight in the goals slice
        weightGoals: state.weightGoals
          ? { ...state.weightGoals, currentWeight: savedEntry.weight }
          : null,
        isSaving: false,
      }));

      // Update current weight in the user slice
      if (fullGet().updateCurrentUserWeight) {
        fullGet().updateCurrentUserWeight(savedEntry.weight);
      }

      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: "Weight logged successfully!",
          type: "success",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error adding weight log entry:", error);
      set({ error: errorMessage, isSaving: false });
      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: `Failed to log weight: ${errorMessage}`,
          type: "error",
        });
      }
      // Re-throw or handle specific errors if needed
      throw error; // Re-throw to allow modal to handle closing logic
    }
  },

  deleteWeightLogEntry: async (id: string) => {
    set({ isSaving: true, error: null });
    const fullGet = get as () => FullGoalsState;
    try {
      await apiService.goals.deleteWeightLogEntry(id);
      set((state) => ({
        weightLog: state.weightLog.filter((entry) => entry.id !== id),
        isSaving: false,
      }));

      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: "Weight log entry deleted.",
          type: "success",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error deleting weight log entry:", error);
      set({ error: errorMessage, isSaving: false });
      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: `Failed to delete entry: ${errorMessage}`,
          type: "error",
        });
      }
    }
  },
});
