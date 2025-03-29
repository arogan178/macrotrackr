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

  createWeightGoal: (formValues, tdee) => {
    const { 
      currentWeight, 
      targetWeight, 
      startDate,
      targetDate,
      adjustedCalorieIntake: customCalorieIntake,
      weeklyChange: customWeeklyChange,
      calculatedWeeks: customCalculatedWeeks,
      weightGoal: customWeightGoal
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
    const adjustedCalorieIntake = customCalorieIntake || 
      tdee + CALORIE_ADJUSTMENT_FACTORS[weightGoal];

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
