import { StateCreator } from "zustand";
import {
  WeightGoals,
  WeightGoalFormValues,
  SetWeightGoalPayload, // Import payload types
  UpdateWeightGoalPayload,
} from "../types"; // Assuming payload types are moved/copied here or imported directly
import { CALORIE_ADJUSTMENT_FACTORS } from "../constants";
import {
  apiService,
  WeightLogEntry, // This type now has 'timestamp'
  AddWeightLogPayload,
} from "@/utils/api-service";
import { getErrorMessage } from "@/utils/error-handling";
import { formatISO } from "date-fns"; // Import formatISO

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
    tdee: number
  ) => Promise<void>;
  updateWeightGoal: (
    // New action for updates
    formValues: WeightGoalFormValues,
    tdee: number
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

// Helper function to calculate goal details (extracted for reuse)
function calculateGoalDetails(
  formValues: WeightGoalFormValues,
  tdee: number,
  existingStartDate?: string | null
): Omit<SetWeightGoalPayload, "startingWeight"> & { weightGoal: string } {
  const {
    startingWeight, // Needed for calculation but not always sent
    targetWeight,
    startDate,
    targetDate,
    calorieTarget: customCalorieTarget,
    weeklyChange: customWeeklyChange,
    calculatedWeeks: customCalculatedWeeks,
    weightGoal: customWeightGoal,
  } = formValues;

  let weightGoal = customWeightGoal || "maintain";
  if (!customWeightGoal && startingWeight && targetWeight) {
    if (targetWeight < startingWeight) weightGoal = "lose";
    else if (targetWeight > startingWeight) weightGoal = "gain";
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
    startingWeight &&
    targetWeight
  ) {
    const targetDateObj = new Date(targetDate);
    const diffTime = Math.max(0, targetDateObj.getTime() - today.getTime());
    calculatedWeeks = Math.max(
      1,
      Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7))
    );
    const weightDifference = Math.abs(targetWeight - startingWeight);
    weeklyChange = calculatedWeeks > 0 ? weightDifference / calculatedWeeks : 0;
  }
  if (
    weeklyChange &&
    weightGoal !== "maintain" &&
    startingWeight &&
    targetWeight
  ) {
    const calorieChangePerKg = 7700;
    const totalCalorieDiff =
      (targetWeight - startingWeight) * calorieChangePerKg;
    const totalDays = calculatedWeeks * 7;
    dailyChange = totalDays > 0 ? totalCalorieDiff / totalDays : 0;
  } else {
    dailyChange = tdee - calorieTarget;
  }

  return {
    // startingWeight is omitted here, added specifically in createWeightGoal
    targetWeight,
    weightGoal,
    startDate: startDate || existingStartDate || formattedToday, // Use existing if available for update
    targetDate: targetDate || null,
    calorieTarget: calorieTarget,
    calculatedWeeks,
    weeklyChange,
    dailyChange,
  };
}

export const createGoalsSlice: StateCreator<GoalsSlice, [], [], GoalsSlice> = (
  set,
  get
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

  // --- Create Action ---
  createWeightGoal: async (formValues, tdee) => {
    set({ isSaving: true, error: null });
    const fullGet = get as () => FullGoalsState;
    let savedWeightGoal: WeightGoals | null = null;
    let savedLogEntry: WeightLogEntry | null = null;

    try {
      // --- Step 1: Create the Weight Goal ---
      const goalDetails = calculateGoalDetails(formValues, tdee);
      const goalPayload: SetWeightGoalPayload = {
        startingWeight: formValues.startingWeight,
        ...goalDetails,
      };
      savedWeightGoal = await apiService.goals.createWeightGoal(goalPayload);
      console.log("[GoalsSlice] Weight goal created successfully.");

      // --- Step 2: Add the Initial Weight Log Entry ---
      if (goalPayload.startingWeight !== null) {
        const now = new Date();
        const initialLogPayload: AddWeightLogPayload = {
          timestamp: formatISO(now),
          weight: goalPayload.startingWeight,
        };
        try {
          savedLogEntry = await apiService.goals.addWeightLogEntry(
            initialLogPayload
          );
        } catch (logError) {
          console.error(
            "[GoalsSlice] Failed to add initial weight log entry:",
            logError
          );
          // Notify about log failure, but goal creation succeeded
          if (fullGet().addNotification) {
            fullGet().addNotification({
              message:
                "Weight goal created, but failed to add initial weight log.",
              type: "warning",
            });
          }
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
                new Date(a.timestamp).getTime()
            )
          : state.weightLog,
        isSaving: false,
        error: null,
      }));

      // --- Step 3.5: Fetch latest weight log to ensure UI is up to date ---
      await get().fetchWeightLog();

      // --- Step 4: Update User Slice (if log entry succeeded) ---
      if (savedLogEntry && fullGet().updateCurrentUserWeight?.call) {
        fullGet().updateCurrentUserWeight(savedLogEntry.weight);
      }

      // --- Step 5: Success Notification ---
      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: "Weight goal created successfully!",
          type: "success",
        });
      }
    } catch (error) {
      // --- Error Handling for Goal Creation ---
      const errorMessage = getErrorMessage(error);
      console.error("[GoalsSlice] Error creating weight goal:", error);
      set({ error: errorMessage, isSaving: false });
      if (fullGet().addNotification) {
        fullGet().addNotification({
          message: `Failed to create weight goal: ${errorMessage}`,
          type: "error",
        });
      }
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
      // Calculate details, passing existing start date if available
      const goalDetails = calculateGoalDetails(
        formValues,
        tdee,
        currentGoal.startDate
      );

      // Construct payload specifically for update (omits startingWeight)
      const payload: UpdateWeightGoalPayload = {
        ...goalDetails,
      };

      // If updateWeightGoal expects two arguments, pass tdee as second argument
      const savedWeightGoal = await apiService.goals.updateWeightGoal(
        payload,
        tdee
      );

      set({ weightGoals: savedWeightGoal, isSaving: false, error: null });

      // --- Fetch latest weight log to ensure UI is up to date ---
      await get().fetchWeightLog();

      if (fullGet().addNotification?.call) {
        fullGet().addNotification({
          message: "Weight goal updated successfully!",
          type: "success",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error updating weight goal:", error);
      set({ error: errorMessage, isSaving: false });
      if (fullGet().addNotification?.call) {
        fullGet().addNotification({
          message: `Failed to update weight goal: ${errorMessage}`,
          type: "error",
        });
      }
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

      if (fullGet().addNotification?.call) {
        fullGet().addNotification({
          message: "Weight goal deleted successfully!",
          type: "success",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error deleting weight goal:", error);
      set({ error: errorMessage, isSaving: false });
      if (fullGet().addNotification?.call) {
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

  // --- Weight Log Actions ---
  fetchWeightLog: async () => {
    set({ isLoading: true, error: null });
    const fullGet = get as () => FullGoalsState;
    try {
      const logData = await apiService.goals.getWeightLog();
      // Sort by timestamp descending
      const sortedLog = logData.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      set({ weightLog: sortedLog, isLoading: false });
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error fetching weight log:", error);
      set({ isLoading: false, error: errorMessage });
      if (fullGet().addNotification?.call) {
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
      const savedEntry = await apiService.goals.addWeightLogEntry(payload); // API returns entry with timestamp

      set((state) => ({
        // Add new entry and re-sort by timestamp
        weightLog: [...(state.weightLog || []), savedEntry].sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
        // Update current weight in the goals slice
        weightGoals: state.weightGoals
          ? { ...state.weightGoals, currentWeight: savedEntry.weight } // Update currentWeight instead? Or maybe startingWeight is fine if it represents the *latest* known weight? Let's stick to currentWeight for clarity if the backend supports it. If not, update startingWeight. Assuming backend updates user_details.weight which is reflected in getWeightGoals response.
          : null,
        isSaving: false,
      }));

      // Ensure user slice is updated correctly here too
      const fullGet = get as () => FullGoalsState;
      if (fullGet().updateCurrentUserWeight) {
        fullGet().updateCurrentUserWeight(savedEntry.weight);
      }

      if (fullGet().addNotification?.call) {
        fullGet().addNotification({
          message: "Weight logged successfully!",
          type: "success",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error("Error adding weight log entry:", error);
      set({ error: errorMessage, isSaving: false });
      if (fullGet().addNotification?.call) {
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
      // Call the API which now returns { success: true, id: 'deleted_id' }
      const result = await apiService.goals.deleteWeightLogEntry(id);

      // Find the new latest weight AFTER successful deletion, sorting by timestamp
      const remainingLog = get().weightLog.filter(
        (entry) => entry.id !== result.id
      );
      const sortedRemainingLog = [...remainingLog].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      // newLatestWeight will be null if sortedRemainingLog is empty
      const newLatestWeight =
        sortedRemainingLog.length > 0 ? sortedRemainingLog[0].weight : null;

      set({
        weightLog: sortedRemainingLog, // Update state with the filtered and sorted log
        isSaving: false,
      });

      // Update user slice ONLY if a latest weight exists
      if (fullGet().updateCurrentUserWeight && newLatestWeight !== null) {
        console.log(
          `[GoalsSlice] Deleting log entry, updating user weight to: ${newLatestWeight}`
        );
        fullGet().updateCurrentUserWeight(newLatestWeight);
      } else {
        console.log(
          "[GoalsSlice] Deleting last log entry, NOT updating user weight in store."
        );
        // If newLatestWeight is null, do nothing to the userSlice weight
      }

      // Notification
      if (fullGet().addNotification?.call) {
        fullGet().addNotification({
          message: "Weight log entry deleted.",
          type: "success",
        });
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      console.error(`Error deleting weight log entry with id ${id}:`, error);
      set({ error: errorMessage, isSaving: false });
      if (fullGet().addNotification?.call) {
        fullGet().addNotification({
          message: `Failed to delete entry: ${errorMessage}`,
          type: "error",
        });
      }
      // Re-throw might not be needed unless handled specifically higher up
      // throw error;
    }
  },
});

// Helper type definition (assuming it's needed by the slice)
interface WeightGoals {
  startingWeight: number;
  currentWeight: number; // Added for clarity if backend provides it
  targetWeight: number | null;
  weightGoal: "lose" | "maintain" | "gain" | null;
  startDate: string | null;
  targetDate: string | null;
  calorieTarget: number | null;
  calculatedWeeks: number | null;
  weeklyChange: number | null;
  dailyChange: number | null;
}
