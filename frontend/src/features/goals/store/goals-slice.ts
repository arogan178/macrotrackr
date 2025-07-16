import { formatISO } from "date-fns";
import { StateCreator } from "zustand";

import { WeightGoalFormValues, WeightGoals } from "@/types/goal";
import {
  AddWeightLogPayload,
  apiService,
  WeightLogEntry,
} from "@/utils/apiServices";
import { getErrorMessage } from "@/utils/errorHandling";

import { ERROR_MESSAGES, SUCCESS_MESSAGES } from "../constants";

// Define the slice interface
export interface GoalsSlice {
  weightGoals: WeightGoals | undefined;
  weightLog: WeightLogEntry[];
  isSaving: boolean;
  error: string | undefined;

  // Actions
  setWeightGoals: (goals: WeightGoals | undefined) => void;
  setWeightLog: (log: WeightLogEntry[]) => void;
  createWeightGoal: (
    formValues: WeightGoalFormValues,
    tdee: number,
  ) => Promise<void>;
  updateWeightGoal: (
    formValues: WeightGoalFormValues,
    tdee: number,
  ) => Promise<void>;
  deleteWeightGoal: () => Promise<void>;
  setSaving: (saving: boolean) => void;
  setError: (error: string | undefined) => void;
  clearError: () => void;
  resetGoals: () => Promise<void>;

  // Weight Log Actions
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
  weightGoals: undefined,
  weightLog: [],
  isSaving: false,
  error: undefined,

  // --- Set Actions ---
  setWeightGoals: (goals) => set({ weightGoals: goals, error: undefined }),
  setWeightLog: (log) => set({ weightLog: log }),

  // --- Create Action ---
  createWeightGoal: async (formValues, tdee) => {
    set({ isSaving: true, error: undefined });
    const fullGet = get as () => FullGoalsState;
    let savedWeightGoal: WeightGoals | undefined;
    let savedLogEntry: WeightLogEntry | undefined;

    try {
      // --- Step 1: Create the Weight Goal ---

      // Call API with form values and tdee
      savedWeightGoal = (await apiService.goals.createWeightGoal(
        formValues,
        tdee,
      )) as WeightGoals | undefined;
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
        error: undefined,
      }));

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

    set({ isSaving: true, error: undefined });
    const fullGet = get as () => FullGoalsState;

    try {
      // Call API with form values and tdee
      const savedWeightGoal = await apiService.goals.updateWeightGoal(
        formValues,
        tdee,
      );

      set({
        weightGoals: savedWeightGoal as WeightGoals,
        isSaving: false,
        error: undefined,
      });

      // --- Loader now hydrates weight log; no fetchWeightLog needed ---

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
    set({ isSaving: true, error: undefined });
    const fullGet = get as () => FullGoalsState;
    try {
      await apiService.goals.deleteWeightGoals(); // Call API service
      // NEW: Clear weight log when goal is deleted
      set({
        weightGoals: undefined,
        weightLog: [],
        isSaving: false,
        error: undefined,
      });

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
  // setLoading removed (no longer needed)
  setSaving: (saving) => set({ isSaving: saving }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: undefined }),

  // --- Reset Action ---
  resetGoals: async () => {
    // NEW: Clear weight log on reset
    set({
      weightGoals: undefined,
      weightLog: [],
      error: undefined,
      // isLoading removed (no longer needed)
      isSaving: false,
    });
    // Optionally, refetch or perform other cleanup
  },

  // --- Weight Log Actions ---
  addWeightLogEntry: async (payload: AddWeightLogPayload) => {
    set({ isSaving: true, error: undefined });
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
            : undefined,
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
    set({ isSaving: true, error: undefined });
    const fullGet = get as () => FullGoalsState;
    // Optimistic UI: update weightLog immediately
    const previousLog = get().weightLog;
    const optimisticLog = previousLog.filter((entry) => entry.id !== id);
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
          : undefined,
      };
    });

    // Determine if the deleted entry was the latest
    const sortedPreviousLog = [...previousLog].sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
    const latestEntry = sortedPreviousLog[0];
    const deletedEntry = previousLog.find((entry) => entry.id === id);
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
        sortedRemainingLog.length > 0
          ? sortedRemainingLog[0].weight
          : undefined;

      set((state) => ({
        weightLog: sortedRemainingLog,
        weightGoals: state.weightGoals
          ? {
              ...state.weightGoals,
              currentWeight: newLatestWeight ?? state.weightGoals.currentWeight,
            }
          : undefined,
        isSaving: false,
      }));

      if (shouldUpdateUserWeight && newLatestWeight !== undefined) {
        fullGet().updateCurrentUserWeight?.(newLatestWeight);
      }
      fullGet().addNotification?.({
        message: SUCCESS_MESSAGES.weightDeleted,
        type: "success",
      });
    } catch (error) {
      // Rollback optimistic update on error
      set((state) => ({
        weightLog: previousLog,
        weightGoals: state.weightGoals
          ? {
              ...state.weightGoals,
              currentWeight:
                previousLog[0]?.weight ?? state.weightGoals.currentWeight,
            }
          : undefined,
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
