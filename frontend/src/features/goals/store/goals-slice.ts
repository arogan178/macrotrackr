import { StateCreator } from "zustand";
import { WeightGoals, WeightGoalFormValues } from "@/types/goal";
import { SUCCESS_MESSAGES, ERROR_MESSAGES } from "../constants";
import {
  apiService,
  WeightLogEntry,
  AddWeightLogPayload,
} from "@/utils/api-service";
import { getErrorMessage } from "@/utils/error-handling";
import { formatISO } from "date-fns";

// Define the slice interface
export interface GoalsSlice {
  // ... existing state ...
  weightGoals: WeightGoals | null;
  weightLog: WeightLogEntry[]; // Uses the updated type
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;

  // Actions
  fetchWeightGoals: () => Promise<void>;
  setWeightGoals: (goals: WeightGoals | null) => void;
  createWeightGoal: (
    // Renamed for clarity
    formValues: WeightGoalFormValues,
    tdee: number,
  ) => Promise<void>;
  updateWeightGoal: (
    // New action for updates
    formValues: WeightGoalFormValues,
    tdee: number,
  ) => Promise<void>;
  deleteWeightGoal: () => Promise<void>;
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  resetGoals: () => Promise<void>;

  // Weight Log Actions
  fetchWeightLog: () => Promise<void>;
  addWeightLogEntry: (payload: AddWeightLogPayload) => Promise<void>;
  deleteWeightLogEntry: (id: string) => Promise<void>;
}

// ... FullGoalsState definition ...
type FullGoalsState = GoalsSlice & {
  addNotification?: (notification: {
    message: string;
    type: "success" | "error" | "info" | "warning";
  }) => void;
  resetHabits?: () => Promise<void>;
  updateCurrentUserWeight?: (newWeight: number) => void;
};

export const createGoalsSlice: StateCreator<GoalsSlice, [], [], GoalsSlice> = (
  set,
  get,
) => ({
  // ... initial state ...
  weightGoals: null,
  weightLog: [],
  isLoading: false,
  isSaving: false,
  error: null,

  // --- Fetch Actions ---
  fetchWeightGoals: async () => {
    set({ isLoading: true, error: null });
    const fullGet = get as () => FullGoalsState;
    try {
      const weightGoalsData = await apiService.goals.getWeightGoals();

      if (weightGoalsData) {
        // Get latest weight to determine currentWeight
        const weightLog = await apiService.goals.getWeightLog();
        const latestWeight =
          weightLog.length > 0
            ? weightLog[weightLog.length - 1].weight
            : weightGoalsData.startingWeight;

        // Transform to WeightGoals with currentWeight
        const goalsWithCurrentWeight: WeightGoals = {
          ...weightGoalsData,
          currentWeight: latestWeight,
          targetWeight:
            weightGoalsData.targetWeight || weightGoalsData.startingWeight,
          weightGoal: (weightGoalsData.weightGoal || "maintain") as
            | "lose"
            | "maintain"
            | "gain",
          startDate:
            weightGoalsData.startDate || new Date().toISOString().split("T")[0],
          targetDate:
            weightGoalsData.targetDate ||
            new Date().toISOString().split("T")[0],
          calorieTarget: weightGoalsData.calorieTarget || 2000,
          calculatedWeeks: weightGoalsData.calculatedWeeks || 1,
          weeklyChange: weightGoalsData.weeklyChange || 0,
          dailyChange: weightGoalsData.dailyChange || 0,
        };

        set({ weightGoals: goalsWithCurrentWeight, isLoading: false });
      } else {
        set({ weightGoals: null, isLoading: false });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error fetching weight goals:", error);
      set({ isLoading: false, error: errorMessage });
      fullGet().addNotification?.({
        message: `${ERROR_MESSAGES.goalFetch}: ${errorMessage}`,
        type: "error",
      });
    }
  },

  // --- Set Actions ---
  setWeightGoals: (goals) => set({ weightGoals: goals, error: null }),

  // --- Create Action ---
  createWeightGoal: async (formValues, tdee) => {
    set({ isSaving: true, error: null });
    const fullGet = get as () => FullGoalsState;
    let savedWeightGoal: WeightGoals | null = null;
    let savedLogEntry: WeightLogEntry | null = null;

    try {
      // --- Step 1: Create the Weight Goal ---

      // Call API with form values and tdee
      savedWeightGoal = await apiService.goals.createWeightGoal(
        formValues,
        tdee,
      );
      console.log("[GoalsSlice] Weight goal created successfully.");

      // --- Step 2: Add the Initial Weight Log Entry ---
      if (formValues.startingWeight && formValues.startingWeight > 0) {
        const now = new Date();
        const initialLogPayload: AddWeightLogPayload = {
          timestamp: formatISO(now),
          weight: formValues.startingWeight,
        };
        try {
          savedLogEntry =
            await apiService.goals.addWeightLogEntry(initialLogPayload);
        } catch (logError) {
          console.error(
            "[GoalsSlice] Failed to add initial weight log entry:",
            logError,
          );
          // Notify about log failure, but goal creation succeeded
          fullGet().addNotification?.({
            message: ERROR_MESSAGES.weightLog,
            type: "warning",
          });
          // Continue without the log entry if it fails
        }
      }

      // --- Step 3: Update State Atomically ---
      set((state) => ({
        weightGoals: savedWeightGoal,
        weightLog: savedLogEntry
          ? [...(state.weightLog || []), savedLogEntry].sort(
            (a, b) =>
              new Date(b.timestamp).getTime() -
                new Date(a.timestamp).getTime(),
          )
          : state.weightLog,
        isSaving: false,
        error: null,
      }));

      // --- Step 3.5: Fetch latest weight log to ensure UI is up to date ---
      await get().fetchWeightLog();

      // --- Step 4: Update User Slice (if log entry succeeded) ---
      if (savedLogEntry) {
        fullGet().updateCurrentUserWeight?.(savedLogEntry.weight);
      }

      // --- Step 5: Success Notification ---
      fullGet().addNotification?.({
        message: SUCCESS_MESSAGES.goalCreated,
        type: "success",
      });
    } catch (error) {
      // --- Error Handling for Goal Creation ---
      const errorMessage = getErrorMessage(error);
      console.error("[GoalsSlice] Error creating weight goal:", error);
      set({ error: errorMessage, isSaving: false });
      fullGet().addNotification?.({
        message: `${ERROR_MESSAGES.goalCreate}: ${errorMessage}`,
        type: "error",
      });
      throw error; // Re-throw error for potential handling in UI
    }
  },

  // --- Update Action ---
  updateWeightGoal: async (formValues, tdee) => {
    const currentGoal = get().weightGoals;
    if (!currentGoal) {
      console.error("Cannot update goal: No existing goal found.");
      set({ error: "Cannot update goal: No existing goal found." });
      return;
    }

    set({ isSaving: true, error: null });
    const fullGet = get as () => FullGoalsState;

    try {
      // Call API with form values and tdee
      const savedWeightGoal = await apiService.goals.updateWeightGoal(
        formValues,
        tdee,
      );

      set({ weightGoals: savedWeightGoal, isSaving: false, error: null });

      // --- Fetch latest weight log to ensure UI is up to date ---
      await get().fetchWeightLog();

      fullGet().addNotification?.({
        message: SUCCESS_MESSAGES.goalUpdated,
        type: "success",
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error updating weight goal:", error);
      set({ error: errorMessage, isSaving: false });
      fullGet().addNotification?.({
        message: `${ERROR_MESSAGES.goalUpdate}: ${errorMessage}`,
        type: "error",
      });
      throw error; // Re-throw error
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

      fullGet().addNotification?.({
        message: SUCCESS_MESSAGES.goalDeleted,
        type: "success",
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error deleting weight goal:", error);
      set({ error: errorMessage, isSaving: false });
      fullGet().addNotification?.({
        message: `${ERROR_MESSAGES.goalDelete}: ${errorMessage}`,
        type: "error",
      });
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

  // --- Weight Log Actions ---
  fetchWeightLog: async () => {
    set({ isLoading: true, error: null });
    const fullGet = get as () => FullGoalsState;
    try {
      const logData = await apiService.goals.getWeightLog();
      // Sort by timestamp descending
      const sortedLog = logData.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      set({ weightLog: sortedLog, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error fetching weight log:", error);
      set({ isLoading: false, error: errorMessage });
      fullGet().addNotification?.({
        message: `${ERROR_MESSAGES.weightFetch}: ${errorMessage}`,
        type: "error",
      });
    }
  },
  addWeightLogEntry: async (payload: AddWeightLogPayload) => {
    set({ isSaving: true, error: null });
    const fullGet = get as () => FullGoalsState;
    try {
      const savedEntry = await apiService.goals.addWeightLogEntry(payload); // API returns entry with timestamp

      set((state) => {
        const newLog = [...(state.weightLog || []), savedEntry].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        );
        // Only update currentWeight, not the whole object
        return {
          weightLog: newLog,
          weightGoals: state.weightGoals
            ? {
              ...state.weightGoals,
              currentWeight:
                  newLog[0]?.weight ?? state.weightGoals.currentWeight,
            }
            : null,
          isSaving: false,
        };
      });

      fullGet().updateCurrentUserWeight?.(savedEntry.weight);
      fullGet().addNotification?.({
        message: SUCCESS_MESSAGES.weightLogged,
        type: "success",
      });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error adding weight log entry:", error);
      set({ error: errorMessage, isSaving: false });
      fullGet().addNotification?.({
        message: `${ERROR_MESSAGES.weightLog}: ${errorMessage}`,
        type: "error",
      });
      throw error;
    }
  },
  deleteWeightLogEntry: async (id: string) => {
    set({ isSaving: true, error: null });
    const fullGet = get as () => FullGoalsState;
    // Optimistic UI: update weightLog immediately
    const prevLog = get().weightLog;
    const optimisticLog = prevLog.filter((entry) => entry.id !== id);
    // Update currentWeight optimistically
    set((state) => {
      const sortedOptimistic = [...optimisticLog].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      return {
        weightLog: optimisticLog,
        weightGoals: state.weightGoals
          ? {
            ...state.weightGoals,
            currentWeight:
                sortedOptimistic[0]?.weight ?? state.weightGoals.currentWeight,
          }
          : null,
      };
    });

    // Determine if the deleted entry was the latest
    const sortedPrevLog = [...prevLog].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const latestEntry = sortedPrevLog[0];
    const deletedEntry = prevLog.find((entry) => entry.id === id);
    let shouldUpdateUserWeight = false;
    if (latestEntry && deletedEntry && latestEntry.id === deletedEntry.id) {
      shouldUpdateUserWeight = true;
    }

    try {
      // Call the API
      const result = await apiService.goals.deleteWeightLogEntry(id);

      // After server confirms, get the new latest weight
      const remainingLog = get().weightLog.filter(
        (entry) => entry.id !== result.id,
      );
      const sortedRemainingLog = [...remainingLog].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
      const newLatestWeight =
        sortedRemainingLog.length > 0 ? sortedRemainingLog[0].weight : null;

      set((state) => ({
        weightLog: sortedRemainingLog,
        weightGoals: state.weightGoals
          ? {
            ...state.weightGoals,
            currentWeight: newLatestWeight ?? state.weightGoals.currentWeight,
          }
          : null,
        isSaving: false,
      }));

      if (shouldUpdateUserWeight && newLatestWeight !== null) {
        fullGet().updateCurrentUserWeight?.(newLatestWeight);
      }
      fullGet().addNotification?.({
        message: SUCCESS_MESSAGES.weightDeleted,
        type: "success",
      });
    } catch (error) {
      // Rollback optimistic update on error
      set((state) => ({
        weightLog: prevLog,
        weightGoals: state.weightGoals
          ? {
            ...state.weightGoals,
            currentWeight:
                prevLog[0]?.weight ?? state.weightGoals.currentWeight,
          }
          : null,
        isSaving: false,
      }));
      const errorMessage = getErrorMessage(error);
      console.error(`Error deleting weight log entry with id ${id}:`, error);
      set({ error: errorMessage });
      fullGet().addNotification?.({
        message: `${ERROR_MESSAGES.weightDelete}: ${errorMessage}`,
        type: "error",
      });
    }
  },
});
