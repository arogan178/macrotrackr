import { StateCreator } from "zustand";
import { WeightGoals, WeightGoalFormValues } from "../types";
import { CALORIE_ADJUSTMENT_FACTORS } from "../constants";

export interface GoalsSlice {
  weightGoals: WeightGoals | null;
  isLoading: boolean;
  error: string | null;
  macroDailyTotals: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  } | null;
  setWeightGoals: (goals: WeightGoals) => void;
  createWeightGoal: (formValues: WeightGoalFormValues, tdee: number) => void;
  updateAdjustedCalorieIntake: (calories: number) => void;
  setTargetDate: (date: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;
  resetGoals: () => void;
}

export const createGoalsSlice: StateCreator<GoalsSlice & any> = (set, get) => ({
  weightGoals: null,
  isLoading: false,
  error: null,
  macroDailyTotals: null,

  setWeightGoals: (goals) =>
    set((state) => ({
      ...state,
      weightGoals: goals,
      error: null,
    })),

  // resetGoals: async () => {
  //   try {
  //     set({ isLoading: true });
  //     // API call to reset goals would go here
  //     // await api.resetGoals();

  //     // Reset local state
  //     set({
  //       weightGoals: null,
  //       // Reset any other goals-related state
  //       isLoading: false,
  //     });

  //     // Refetch necessary data
  //     get().fetchUserDetails();
  //     get().fetchMacroData();
  //   } catch (error) {
  //     set({
  //       error: "Failed to reset goals. Please try again.",
  //       isLoading: false,
  //     });
  //   }
  // },
  createWeightGoal: (formValues, tdee) => {
    const { currentWeight, targetWeight, targetDate } = formValues;

    // Determine weight goal type (lose, maintain, gain)
    let weightGoal: "lose" | "maintain" | "gain" = "maintain";
    if (targetWeight < currentWeight) {
      weightGoal = "lose";
    } else if (targetWeight > currentWeight) {
      weightGoal = "gain";
    }

    // Calculate adjusted calorie intake based on goal
    const adjustedCalorieIntake = tdee + CALORIE_ADJUSTMENT_FACTORS[weightGoal];

    // Calculate weeks to goal if target date is provided
    let calculatedWeeks, weeklyChange, dailyDeficit;
    if (targetDate) {
      const today = new Date();
      const targetDateObj = new Date(targetDate);
      const diffTime = Math.abs(targetDateObj.getTime() - today.getTime());
      calculatedWeeks = Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 7));

      // Calculate weekly change and daily deficit
      const weightDifference = Math.abs(targetWeight - currentWeight);
      weeklyChange = weightDifference / calculatedWeeks;
      dailyDeficit =
        ((weightGoal === "lose" ? -1 : 1) * (weeklyChange * 7700)) / 7; // 7700 calories ≈ 1kg
    }

    // Create the weight goals object
    const weightGoals: WeightGoals = {
      currentWeight,
      targetWeight,
      weightGoal,
      targetDate,
      adjustedCalorieIntake,
      calculatedWeeks,
      weeklyChange,
      dailyDeficit,
    };

    // Update state with the new weight goals
    set((state) => ({
      ...state,
      weightGoals,
      error: null,
    }));
  },

  updateAdjustedCalorieIntake: (calories) =>
    set((state) => ({
      ...state,
      weightGoals: state.weightGoals
        ? { ...state.weightGoals, adjustedCalorieIntake: calories }
        : null,
    })),

  setTargetDate: (date) =>
    set((state) => ({
      ...state,
      weightGoals: state.weightGoals
        ? { ...state.weightGoals, targetDate: date }
        : null,
    })),

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

  resetGoals: () =>
    set((state) => ({
      ...state,
      weightGoals: null,
      error: null,
      isLoading: false,
    })),
});
