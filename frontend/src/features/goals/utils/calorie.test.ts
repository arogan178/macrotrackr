import { describe, expect, it } from "vitest";

import {
  computeDailyAdjustment,
  computeEffectiveTargetCalories,
} from "./calorie";

describe("calorie", () => {
  describe("computeEffectiveTargetCalories", () => {
    it("returns tdee when no goals provided", () => {
      expect(computeEffectiveTargetCalories(2000)).toBe(2000);
    });

    it("prefers goals.calorieTarget over tdee", () => {
      const goals = { calorieTarget: 1800 };
      expect(computeEffectiveTargetCalories(2000, goals)).toBe(1800);
    });

    it("returns 0 for non-finite tdee", () => {
      expect(computeEffectiveTargetCalories(Infinity)).toBe(0);
      expect(computeEffectiveTargetCalories(Number.NaN)).toBe(0);
    });

    it("uses tdee when calorieTarget is 0 (falsy check)", () => {
      const goals = { calorieTarget: 0 };
      expect(computeEffectiveTargetCalories(2000, goals)).toBe(2000);
    });

    it("handles missing goals", () => {
      expect(computeEffectiveTargetCalories(2000, undefined)).toBe(2000);
    });
  });

  describe("computeDailyAdjustment", () => {
    it("returns dailyChange when set", () => {
      const goals = { dailyChange: -500 };
      expect(computeDailyAdjustment(2000, goals)).toBe(-500);
    });

    it("calculates difference when dailyChange is 0", () => {
      const goals = { calorieTarget: 1500, dailyChange: 0 };
      expect(computeDailyAdjustment(2000, goals)).toBe(500);
    });

    it("returns 0 when no goals", () => {
      expect(computeDailyAdjustment(2000)).toBe(0);
    });

    it("returns 0 when tdee is 0", () => {
      const goals = { calorieTarget: 1500 };
      expect(computeDailyAdjustment(0, goals)).toBe(0);
    });
  });
});
