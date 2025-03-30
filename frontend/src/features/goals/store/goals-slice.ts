import { StateCreator } from "zustand";
import { WeightGoals, WeightGoalFormValues, MacroTargets } from "../types";
import { CALORIE_ADJUSTMENT_FACTORS } from "../constants";
import { MacroTargetSettings } from "@/features/macroTracking/types";

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
  setWeightGoals: (goals: WeightGoals) => void;
  createWeightGoal: (formValues: WeightGoalFormValues, tdee: number) => void;
  updateAdjustedCalorieIntake: (calories: number) => void;
  setTargetDate: (date: string) => void;

  // Nutritional goals actions
  setMacroTargets: (goals: MacroTargets) => void;
  updateTargetCalories: (calories: number) => void;
  updateMacroDistribution: (distribution: MacroTargetSettings) => void;

  // Common actions
  setLoading: (loading: boolean) => void;
  setError: (error: string) => void;
  clearError: () => void;
  resetGoals: () => void;
}

export const createGoalsSlice: StateCreator<GoalsSlice & any> = (set, get) => ({
  weightGoals: null,
  macroTargets: null,
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

  setMacroTargets: (goals) =>
    set((state) => ({
      ...state,
      macroTargets: goals,
      error: null,
    })),

  updateTargetCalories: (calories) =>
    set((state) => ({
      ...state,
      macroTargets: state.macroTargets
        ? { ...state.macroTargets, target_calories: calories }
        : {
            target_calories: calories,
            macro_distribution: {
              proteinPercentage: 30,
              carbsPercentage: 40,
              fatsPercentage: 30,
            },
          },
    })),

  updateMacroDistribution: (distribution) =>
    set((state) => {
      // If no nutrition goals exist yet, create with defaults
      if (!state.macroTargets) {
        return {
          ...state,
          macroTargets: {
            target_calories: state.weightGoals?.adjustedCalorieIntake || 2000,
            macro_distribution: distribution,
          },
        };
      }

      // Otherwise update the existing macro distribution
      return {
        ...state,
        macroTargets: {
          ...state.macroTargets,
          macro_distribution: distribution,
        },
      };
    }),

  resetGoals: () =>
    set((state) => ({
      ...state,
      weightGoals: null,
      macroTargets: null,
      error: null,
      isLoading: false,
    })),
});
