import { StateCreator } from "zustand";
import { WeightGoals, WeightGoalFormValues, MacroTargets } from "../types";
import { CALORIE_ADJUSTMENT_FACTORS } from "../constants";
import { MacroTargetSettings } from "@/features/macroTracking/types";
import { apiService } from "@/utils/api-service";

export interface GoalsSlice {
  weightGoals: WeightGoals | null;
  macroTargets: MacroTargets | null;
  isLoading: boolean;
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
  setError: (error: string) => void;
  clearError: () => void;
  resetGoals: () => Promise<void>;
}

export const createGoalsSlice: StateCreator<GoalsSlice & any> = (set, get) => ({
  weightGoals: null,
  macroTargets: null,
  isLoading: false,
  error: null,
  macroDailyTotals: null,

  fetchWeightGoals: async () => {
    try {
      set((state) => ({ ...state, isLoading: true }));
      const weightGoals = await apiService.goals.getWeightGoals();
      set((state) => ({
        ...state,
        weightGoals,
        isLoading: false,
        error: null,
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
    }
  },

  setWeightGoals: (goals) =>
    set((state) => ({
      ...state,
      weightGoals: goals,
      error: null,
    })),

  createWeightGoal: async (formValues, tdee) => {
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

    try {
      set((state) => ({ ...state, isLoading: true }));
      // Save to the backend
      await apiService.goals.saveWeightGoals(weightGoals);

      // Update state with the new weight goals
      set((state) => ({
        ...state,
        weightGoals,
        error: null,
        isLoading: false,
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        error:
          error instanceof Error ? error.message : "Failed to save weight goal",
        isLoading: false,
      }));
    }
  },

  updateAdjustedCalorieIntake: async (calories) => {
    try {
      set((state) => ({ ...state, isLoading: true }));

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
        isLoading: false,
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update calorie intake",
        isLoading: false,
      }));
    }
  },

  setTargetDate: async (date) => {
    try {
      set((state) => ({ ...state, isLoading: true }));

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
        isLoading: false,
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update target date",
        isLoading: false,
      }));
    }
  },

  setLoading: (loading) =>
    set((state) => ({
      ...state,
      isLoading: loading,
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
      set((state) => ({ ...state, isLoading: true }));
      const macroTargets = await apiService.goals.getMacroTargets();
      set((state) => ({
        ...state,
        macroTargets,
        isLoading: false,
        error: null,
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
      set((state) => ({ ...state, isLoading: true }));

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
        isLoading: false,
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update target calories",
        isLoading: false,
      }));
    }
  },

  updateMacroDistribution: async (distribution) => {
    try {
      set((state) => ({ ...state, isLoading: true }));

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
        isLoading: false,
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        error:
          error instanceof Error
            ? error.message
            : "Failed to update macro distribution",
        isLoading: false,
      }));
    }
  },

  resetGoals: async () => {
    try {
      set((state) => ({ ...state, isLoading: true }));

      // Call the API to reset goals
      await apiService.goals.resetGoals();

      // Reset state
      set((state) => ({
        ...state,
        weightGoals: null,
        macroTargets: null,
        error: null,
        isLoading: false,
      }));
    } catch (error) {
      set((state) => ({
        ...state,
        error: error instanceof Error ? error.message : "Failed to reset goals",
        isLoading: false,
      }));
    }
  },
});
