import { StateCreator } from "zustand";
import { WeightGoals, WeightGoalFormValues, MacroTargets } from "../types";
import { CALORIE_ADJUSTMENT_FACTORS } from "../constants";
import { MacroTargetSettings } from "@/features/macroTracking/types";
import { apiService } from "@/utils/api-service";

export interface GoalsSlice {
  weightGoals: WeightGoals | null;
  macroTargets: MacroTargets | null;
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
  fetchMacroTargets: () => Promise<void>;
  setMacroTargets: (goals: MacroTargets) => void;
  updateTargetCalories: (calories: number) => Promise<void>;
  updateMacroDistribution: (distribution: MacroTargetSettings) => Promise<void>;

  // Common actions
  setLoading: (loading: boolean) => void;
  setSaving: (saving: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;
  resetGoals: () => Promise<void>;
}

export const createGoalsSlice: StateCreator<GoalsSlice & any> = (set, get) => ({
  weightGoals: null,
  macroTargets: null,
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
      let dailyDeficit;

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

      // Calculate daily deficit based on weekly change
      if (weeklyChange) {
        dailyDeficit =
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
        dailyDeficit,
      };

      // Save to the backend
      await apiService.goals.saveWeightGoals(weightGoals);

      // Calculate macro distribution based on the new calorie target
      const defaultMacroDistribution = {
        proteinPercentage: 30,
        carbsPercentage: 40,
        fatsPercentage: 30,
      };

      // Try to save macro targets as well
      try {
        await apiService.goals.saveMacroTargets({
          target_calories: adjustedCalorieIntake,
          macro_distribution: defaultMacroDistribution,
        });

        // Update state with the new macro targets
        set((state) => ({
          ...state,
          macroTargets: {
            macro_distribution: defaultMacroDistribution,
            target_calories: adjustedCalorieIntake,
          },
        }));
      } catch (macroError) {
        console.error("Error saving macro targets:", macroError);
        // Continue with weight goals even if macro targets fail
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

  fetchMacroTargets: async () => {
    try {
      set((state) => ({ ...state, isLoading: true, error: null }));
      const macroTargets = await apiService.goals.getMacroTargets();
      set((state) => ({
        ...state,
        macroTargets,
        isLoading: false,
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        isLoading: false,
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch macro targets",
      }));
      console.error("Error fetching macro targets:", error);
    }
  },

  setMacroTargets: (goals) =>
    set((state) => ({
      ...state,
      macroTargets: goals,
      error: null,
    })),

  updateTargetCalories: async (calories) => {
    try {
      set((state) => ({ ...state, isSaving: true, error: null }));

      // Get current macro targets or create new ones
      const currentMacroTargets = get().macroTargets;
      const updatedMacroTargets = currentMacroTargets
        ? { ...currentMacroTargets, target_calories: calories }
        : {
            target_calories: calories,
            macro_distribution: {
              proteinPercentage: 30,
              carbsPercentage: 40,
              fatsPercentage: 30,
            },
          };

      // Save to backend
      await apiService.goals.saveMacroTargets(updatedMacroTargets);

      // Update state
      set((state) => ({
        ...state,
        macroTargets: updatedMacroTargets,
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

  updateMacroDistribution: async (distribution) => {
    try {
      set((state) => ({ ...state, isSaving: true, error: null }));

      // Get current macro targets or create new ones with defaults
      const { macroTargets, weightGoals } = get();
      const updatedMacroTargets = !macroTargets
        ? {
            target_calories: weightGoals?.adjustedCalorieIntake || 2000,
            macro_distribution: distribution,
          }
        : {
            ...macroTargets,
            macro_distribution: distribution,
          };

      // Save to backend
      await apiService.goals.saveMacroTargets(updatedMacroTargets);

      // Update state
      set((state) => ({
        ...state,
        macroTargets: updatedMacroTargets,
        isSaving: false,
      }));

      // Show success notification
      if (get().addNotification) {
        get().addNotification({
          message: "Macro distribution updated successfully!",
          type: "success",
        });
      }
    } catch (error) {
      set((state) => ({
        ...state,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update macro distribution",
        isSaving: false,
      }));
      console.error("Error updating macro distribution:", error);
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
        macroTargets: null,
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
