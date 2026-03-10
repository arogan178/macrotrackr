import { describe, expect, it } from "vitest";

import {
  calculateDailyTotals,
  calculateMacroCalories,
  MACRO_CALORIES,
} from "./macroCalculations";

describe("macroCalculations", () => {
  describe("MACRO_CALORIES", () => {
    it("has correct values", () => {
      expect(MACRO_CALORIES.protein).toBe(4);
      expect(MACRO_CALORIES.carbs).toBe(4);
      expect(MACRO_CALORIES.fat).toBe(9);
    });
  });

  describe("calculateMacroCalories", () => {
    it("calculates calories correctly", () => {
      const entry = {
        protein: 10,
        carbs: 20,
        fats: 5,
      };
      // 10*4 + 20*4 + 5*9 = 40 + 80 + 45 = 165
      expect(calculateMacroCalories(entry)).toBe(165);
    });

    it("handles missing values as zero", () => {
      const entry = {};
      expect(calculateMacroCalories(entry)).toBe(0);
    });

    it("handles zero values", () => {
      const entry = { protein: 0, carbs: 0, fats: 0 };
      expect(calculateMacroCalories(entry)).toBe(0);
    });
  });

  describe("calculateDailyTotals", () => {
    it("calculates totals from entries", () => {
      const entries = [
        { protein: 10, carbs: 20, fats: 5 },
        { protein: 15, carbs: 25, fats: 10 },
      ];
      const totals = calculateDailyTotals(entries);
      expect(totals.protein).toBe(25);
      expect(totals.carbs).toBe(45);
      expect(totals.fats).toBe(15);
    });

    it("returns zeros for empty array", () => {
      const totals = calculateDailyTotals([]);
      expect(totals.protein).toBe(0);
      expect(totals.carbs).toBe(0);
      expect(totals.fats).toBe(0);
    });
  });
});
