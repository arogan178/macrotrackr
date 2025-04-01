import { StateCreator } from "zustand";
import { WeightGoals, WeightGoalFormValues, MacroTarget } from "../types";
import { CALORIE_ADJUSTMENT_FACTORS } from "../constants";
import { MacroTargetSettings } from "@/features/macroTracking/types";
import { apiService } from "@/utils/api-service";

export interface GoalsSlice {
  weightGoals: WeightGoals | null;
  macroTarget: MacroTarget | null;
  isLoading: boolean;
  isSaving: boolean;
  error: string | null;
  macroDailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null;

  // Weight goals actions
  fetchWeightGoals: () => Promise<void>;
  setWeightGoals: (goals: WeightGoals) => void;
  createWeightGoal: (
    formValues: WeightGoalFormValues,
    tdee: number
  ) => Promise<void>;
  updateAdjustedCalorieIntake: (calories: number) => Promise<void>;
  setTargetDate: (date: string) => Promise<void>;

  // Nutritional goals actions
  fetchMacroTarget: () => Promise<void>;
  setMacroTarget: (goals: MacroTarget) => void;
  updateTargetCalories: (calories: number) => Promise<void>;
  updateMacroTarget: (target: MacroTargetSettings) => Promise<void>;

  // Common actions
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;
  resetGoals: () => Promise<void>;
}

export const createGoalsSlice: StateCreator<GoalsSlice & any> = (set, get) => ({
  weightGoals: null,
  macroTarget: null,
  isLoading: false,
  isSaving: false,
  error: null,
  macroDailyTotals: null,

  fetchWeightGoals: async () => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      const weightGoals = await apiService.goals.getWeightGoals();
      set((state) => ({
        ...state,
        weightGoals,
        isLoading: false,
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch weight goals",
      }));
      console.error("Error fetching weight goals:", error);
    }
  },

  setWeightGoals: (goals) =>
    set((state) => ({
      ...state,
      weightGoals: goals,
      error: null,
    })),

  createWeightGoal: async (formValues, tdee) => {
    try {
      set((state) => ({ ...state, isSaving: true, error: null }));

      const {
        currentWeight,
        targetWeight,
        startDate,
        targetDate,
        adjustedCalorieIntake: customCalorieIntake,
        weeklyChange: customWeeklyChange,
        calculatedWeeks: customCalculatedWeeks,
        weightGoal: customWeightGoal,
      } = formValues;

      // Determine weight goal type (lose, maintain, gain) if not provided
      let weightGoal = customWeightGoal || "maintain";
      if (!customWeightGoal) {
        if (targetWeight < currentWeight) {
          weightGoal = "lose";
        } else if (targetWeight > currentWeight) {
          weightGoal = "gain";
        }
      }

      // Use provided calorie intake or calculate based on goal
      const adjustedCalorieIntake =
        customCalorieIntake || tdee + CALORIE_ADJUSTMENT_FACTORS[weightGoal];

      // Use provided values or calculate if not provided
      let calculatedWeeks = customCalculatedWeeks;
      let weeklyChange = customWeeklyChange;
      let dailyChange;
      // If we don't have calculated weeks or weekly change but have a target date, calculate them
      if ((!calculatedWeeks || !weeklyChange) && targetDate) {
        const today = new Date();
        const targetDateObj = new Date(targetDate);
        const diffTime = Math.abs(targetDateObj.getTime() - today.getTime());
        calculatedWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

        // Calculate weekly change
        const weightDifference = Math.abs(targetWeight - currentWeight);
        weeklyChange = weightDifference / calculatedWeeks;
      }

      // Calculate daily change based on weekly change
      if (weeklyChange) {
        dailyChange =
          ((weightGoal === "lose" ? -1 : 1) * (weeklyChange * 7700)) / 7; // 7700 calories ≈ 1kg
      }

      // Create the weight goals object with all available data
      const weightGoals: WeightGoals = {
        currentWeight,
        targetWeight,
        weightGoal,
        startDate,
        targetDate,
        adjustedCalorieIntake,
        calculatedWeeks,
        weeklyChange,
        dailyChange,
      };

      // Save to the backend
      await apiService.goals.saveWeightGoals(weightGoals);

      // Calculate macro target based on the new calorie target
      const defaultMacroTarget = {
        proteinPercentage: 30,
        carbsPercentage: 40,
        fatsPercentage: 30,
      };

      // Try to save macro target as well
      try {
        await apiService.goals.saveMacroTarget({
          target_calories: adjustedCalorieIntake,
          macro_target: defaultMacroTarget,
        });

        // Update state with the new macro target
        set((state) => ({
          ...state,
          macroTarget: {
            macro_target: defaultMacroTarget,
            target_calories: adjustedCalorieIntake,
          },
        }));
      } catch (macroError) {
        console.error("Error saving macro target:", macroError);
        // Continue with weight goals even if macro target fail
      }

      // Update state with the new weight goals
      set((state) => ({
        ...state,
        weightGoals,
        isSaving: false,
      }));

      // Show success notification (if notification system is available in the store)
      if (get().addNotification) {
        get().addNotification({
          message: "Weight goal saved successfully!",
          type: "success",
        });
      }
    } catch (error) {
      set((state) => ({
        ...state,
        error:
          error instanceof Error ? error.message : "Failed to save weight goal",
        isSaving: false,
      }));
      console.error("Error creating weight goal:", error);
    }
  },

  updateAdjustedCalorieIntake: async (calories) => {
    try {
      set((state) => ({ ...state, isSaving: true, error: null }));

      // Get current weight goals and update the calories
      const currentWeightGoals = get().weightGoals;
      if (!currentWeightGoals) return;

      const updatedWeightGoals = {
        ...currentWeightGoals,
        adjustedCalorieIntake: calories,
      };

      // Save to backend
      await apiService.goals.saveWeightGoals(updatedWeightGoals);

      // Update state
      set((state) => ({
        ...state,
        weightGoals: updatedWeightGoals,
        isSaving: false,
      }));

      // Show success notification
      if (get().addNotification) {
        get().addNotification({
          message: "Calorie intake updated successfully!",
          type: "success",
        });
      }
    } catch (error) {
      set((state) => ({
        ...state,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update calorie intake",
        isSaving: false,
      }));
      console.error("Error updating calorie intake:", error);
    }
  },

  setTargetDate: async (date) => {
    try {
      set((state) => ({ ...state, isSaving: true, error: null }));

      // Get current weight goals and update the target date
      const currentWeightGoals = get().weightGoals;
      if (!currentWeightGoals) return;

      const updatedWeightGoals = {
        ...currentWeightGoals,
        targetDate: date,
      };

      // Save to backend
      await apiService.goals.saveWeightGoals(updatedWeightGoals);

      // Update state
      set((state) => ({
        ...state,
        weightGoals: updatedWeightGoals,
        isSaving: false,
      }));

      // Show success notification
      if (get().addNotification) {
        get().addNotification({
          message: "Target date updated successfully!",
          type: "success",
        });
      }
    } catch (error) {
      set((state) => ({
        ...state,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update target date",
        isSaving: false,
      }));
      console.error("Error updating target date:", error);
    }
  },

  setLoading: (loading) =>
    set((state) => ({
      ...state,
      isLoading: loading,
    })),

  setSaving: (saving) =>
    set((state) => ({
      ...state,
      isSaving: saving,
    })),

  setError: (error) =>
    set((state) => ({
      ...state,
      error,
    })),

  clearError: () =>
    set((state) => ({
      ...state,
      error: null,
    })),

  fetchMacroTarget: async () => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      const macroTarget = await apiService.goals.getMacroTarget();
      set((state) => ({
        ...state,
        macroTarget,
        isLoading: false,
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch macro target",
      }));
      console.error("Error fetching macro target:", error);
    }
  },

  setMacroTarget: (goals) =>
    set((state) => ({
      ...state,
      macroTarget: goals,
      error: null,
    })),

  updateTargetCalories: async (calories) => {
    try {
      set((state) => ({ ...state, isSaving: true, error: null }));

      // Get current macro target or create new ones
      const currentMacroTarget = get().macroTarget;
      const updatedMacroTarget = currentMacroTarget
        ? { ...currentMacroTarget, target_calories: calories }
        : {
            target_calories: calories,
            macro_target: {
              proteinPercentage: 30,
              carbsPercentage: 40,
              fatsPercentage: 30,
            },
          };

      // Save to backend
      await apiService.goals.saveMacroTarget(updatedMacroTarget);

      // Update state
      set((state) => ({
        ...state,
        macroTarget: updatedMacroTarget,
        isSaving: false,
      }));

      // Show success notification
      if (get().addNotification) {
        get().addNotification({
          message: "Target calories updated successfully!",
          type: "success",
        });
      }
    } catch (error) {
      set((state) => ({
        ...state,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update target calories",
        isSaving: false,
      }));
      console.error("Error updating target calories:", error);
    }
  },

  updateMacroTarget: async (target) => {
    try {
      set((state) => ({ ...state, isSaving: true, error: null }));

      // Get current macro target or create new ones with defaults
      const { macroTarget, weightGoals } = get();
      const updatedMacroTarget = !macroTarget
        ? {
            target_calories: weightGoals?.adjustedCalorieIntake || 2000,
            macro_target: target,
          }
        : {
            ...macroTarget,
            macro_target: target,
          };

      // Save to backend
      await apiService.goals.saveMacroTarget(updatedMacroTarget);

      // Update state
      set((state) => ({
        ...state,
        macroTarget: updatedMacroTarget,
        isSaving: false,
      }));

      // Show success notification
      if (get().addNotification) {
        get().addNotification({
          message: "Macro target updated successfully!",
          type: "success",
        });
      }
    } catch (error) {
      set((state) => ({
        ...state,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update macro target",
        isSaving: false,
      }));
      console.error("Error updating macro target:", error);
    }
  },

  resetGoals: async () => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));

      // Call the API to reset goals
      await apiService.goals.resetGoals();

      // Reset state
      set((state) => ({
        ...state,
        weightGoals: null,
        macroTarget: null,
        isLoading: false,
      }));

      // Show success notification
      if (get().addNotification) {
        get().addNotification({
          message: "Goals reset successfully!",
          type: "success",
        });
      }
    } catch (error) {
      set((state) => ({
        ...state,
        error: error instanceof Error ? error.message : "Failed to reset goals",
        isLoading: false,
      }));
      console.error("Error resetting goals:", error);
    }
  },
});
