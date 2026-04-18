import { describe, expect, it } from "vitest";

import type {
  GoalsState,
  SetWeightGoalPayload,
  TimeToGoalCalculation,
  UpdateWeightGoalPayload,
  WeightGoalsResponse,
} from "./types";

describe("goals/types", () => {
  describe("WeightGoalsResponse", () => {
    it("has correct structure", () => {
      const response: WeightGoalsResponse = {
        startingWeight: 80,
        targetWeight: 75,
        weightGoal: "lose",
        startDate: "2024-01-01",
        targetDate: "2024-04-01",
        calorieTarget: 2000,
        calculatedWeeks: 12,
        weeklyChange: -0.5,
        dailyChange: -500,
      };

      expect(response.startingWeight).toBe(80);
      expect(response.targetWeight).toBe(75);
      expect(response.weightGoal).toBe("lose");
    });

    it("allows undefined optional fields", () => {
      const response: WeightGoalsResponse = {
        startingWeight: 80,
        targetWeight: undefined,
        weightGoal: undefined,
        startDate: undefined,
        targetDate: undefined,
        calorieTarget: undefined,
        calculatedWeeks: undefined,
        weeklyChange: undefined,
        dailyChange: undefined,
      };

      expect(response.startingWeight).toBe(80);
      expect(response.targetWeight).toBeUndefined();
    });
  });

  describe("SetWeightGoalPayload", () => {
    it("has correct structure", () => {
      const payload: SetWeightGoalPayload = {
        startingWeight: 80,
        targetWeight: 75,
        weightGoal: "lose",
        startDate: "2024-01-01",
        targetDate: "2024-04-01",
        calorieTarget: 2000,
        calculatedWeeks: 12,
        weeklyChange: -0.5,
        dailyChange: -500,
      };

      expect(payload.startingWeight).toBe(80);
    });

    it("requires startingWeight", () => {
      const payload: SetWeightGoalPayload = {
        startingWeight: 80,
        targetWeight: undefined,
        weightGoal: undefined,
        startDate: undefined,
        targetDate: undefined,
        calorieTarget: undefined,
        calculatedWeeks: undefined,
        weeklyChange: undefined,
        dailyChange: undefined,
      };

      expect(payload.startingWeight).toBe(80);
    });
  });

  describe("UpdateWeightGoalPayload", () => {
    it("omits startingWeight from SetWeightGoalPayload", () => {
      const payload: UpdateWeightGoalPayload = {
        targetWeight: 75,
        weightGoal: "lose",
        startDate: "2024-01-01",
        targetDate: "2024-04-01",
        calorieTarget: 2000,
        calculatedWeeks: 12,
        weeklyChange: -0.5,
        dailyChange: -500,
      };

      // @ts-expect-error startingWeight should not exist on UpdateWeightGoalPayload
      expect(payload.startingWeight).toBeUndefined();
      expect(payload.targetWeight).toBe(75);
    });
  });

  describe("GoalsState", () => {
    it("has correct structure", () => {
      const state: GoalsState = {
        weightGoals: null,
        macroTarget: null,
        isLoading: false,
        error: null,
      };

      expect(state.weightGoals).toBeNull();
      expect(state.macroTarget).toBeNull();
      expect(state.isLoading).toBe(false);
      expect(state.error).toBeNull();
    });
  });

  describe("TimeToGoalCalculation", () => {
    it("has correct structure", () => {
      const calculation: TimeToGoalCalculation = {
        weeksToGoal: 12,
        dailyCalorieDeficit: -500,
        expectedWeightLossPerWeek: 0.5,
      };

      expect(calculation.weeksToGoal).toBe(12);
      expect(calculation.dailyCalorieDeficit).toBe(-500);
      expect(calculation.expectedWeightLossPerWeek).toBe(0.5);
    });
  });
});
