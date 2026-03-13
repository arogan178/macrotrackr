import { describe, expect, it } from "vitest";

import {
  calculateCarbsCalories,
  calculateFatsCalories,
  calculateProteinCalories,
  caloriesFromMacrosRaw,
  caloriesFromMacrosRounded,
  calculateCaloriePercentages,
  calculateMacroTarget,
  calculateDailyTotals,
  calculateBMR,
  calculateTDEE,
  calculateCaloriesFromMacros,
} from "./nutritionCalculations";

describe("nutritionCalculations", () => {
  describe("caloriesFromMacrosRaw", () => {
    it("calculates calories from macros", () => {
      const calories = caloriesFromMacrosRaw(100, 200, 50);
      expect(calories).toBe(1650);
    });

    it("handles zero values", () => {
      expect(caloriesFromMacrosRaw(0, 0, 0)).toBe(0);
    });

    it("calculates protein-only calories (100g = 400 cal)", () => {
      expect(caloriesFromMacrosRaw(100, 0, 0)).toBe(400);
    });

    it("calculates carbs-only calories (100g = 400 cal)", () => {
      expect(caloriesFromMacrosRaw(0, 100, 0)).toBe(400);
    });

    it("calculates fats-only calories (10g = 90 cal)", () => {
      expect(caloriesFromMacrosRaw(0, 0, 10)).toBe(90);
    });

    it("is aliased as calculateCaloriesFromMacros", () => {
      expect(calculateCaloriesFromMacros(100, 100, 100)).toBe(1700);
    });
  });

  describe("caloriesFromMacrosRounded", () => {
    it("rounds calories to nearest integer", () => {
      const calories = caloriesFromMacrosRounded(100.5, 200.5, 50.5);
      expect(calories).toBe(1659);
    });
  });

  describe("calculateProteinCalories", () => {
    it("calculates protein calories", () => {
      expect(calculateProteinCalories(100)).toBe(400);
      expect(calculateProteinCalories(50)).toBe(200);
    });
  });

  describe("calculateCarbsCalories", () => {
    it("calculates carbs calories", () => {
      expect(calculateCarbsCalories(100)).toBe(400);
      expect(calculateCarbsCalories(50)).toBe(200);
    });
  });

  describe("calculateFatsCalories", () => {
    it("calculates fats calories", () => {
      expect(calculateFatsCalories(50)).toBe(450);
      expect(calculateFatsCalories(25)).toBe(225);
    });
  });

  describe("calculateCaloriePercentages", () => {
    it("returns 100% for single macro", () => {
      const result = calculateCaloriePercentages(100, 0, 0);
      expect(result.proteinPercent).toBe(100);
      expect(result.carbsPercent).toBe(0);
      expect(result.fatsPercent).toBe(0);
    });

    it("returns zeros for zero calories", () => {
      const result = calculateCaloriePercentages(0, 0, 0);
      expect(result.proteinPercent).toBe(0);
      expect(result.carbsPercent).toBe(0);
      expect(result.fatsPercent).toBe(0);
    });

    it("calculates balanced percentages", () => {
      // Equal calorie contribution from each macro
      const result = calculateCaloriePercentages(100, 100, 44.44);
      expect(result.proteinPercent + result.carbsPercent + result.fatsPercent).toBeGreaterThan(95);
    });
  });

  describe("calculateMacroTarget", () => {
    it("calculates targets from calories and percentages", () => {
      const result = calculateMacroTarget(2000, 30, 40, 30);
      expect(result.proteinTarget).toBe(150); // 2000 * 0.3 / 4 = 150
      expect(result.carbsTarget).toBe(200);   // 2000 * 0.4 / 4 = 200
      expect(result.fatsTarget).toBe(67);     // 2000 * 0.3 / 9 = 66.67 -> 67
    });

    it("returns zeros for zero calories", () => {
      const result = calculateMacroTarget(0, 30, 40, 30);
      expect(result.proteinTarget).toBe(0);
      expect(result.carbsTarget).toBe(0);
      expect(result.fatsTarget).toBe(0);
    });
  });

  describe("calculateDailyTotals", () => {
    it("returns default totals for empty entries", () => {
      const result = calculateDailyTotals([]);
      expect(result.calories).toBe(0);
      expect(result.protein).toBe(0);
    });

    it("sums up entries correctly", () => {
      const entries = [
        { id: 1, protein: 20, carbs: 30, fats: 10 },
        { id: 2, protein: 15, carbs: 25, fats: 5 },
      ];
      const result = calculateDailyTotals(entries as any);
      expect(result.protein).toBe(35);
      expect(result.carbs).toBe(55);
      expect(result.fats).toBe(15);
    });

    it("handles entries with undefined macros as zero", () => {
      const entries = [{ id: 1, protein: 20, carbs: undefined, fats: 10 }];
      const result = calculateDailyTotals(entries as any);
      expect(result.protein).toBe(20);
      expect(result.carbs).toBe(0);
    });
  });

  describe("calculateBMR", () => {
    it("calculates BMR for male using Mifflin-St Jeor", () => {
      // 10*80 + 6.25*180 - 5*30 + 5 = 1780
      const bmr = calculateBMR(80, 180, 30, "male");
      expect(bmr).toBe(1780);
    });

    it("calculates BMR for female using Mifflin-St Jeor", () => {
      // 10*65 + 6.25*165 - 5*25 - 161 = 1395
      const bmr = calculateBMR(65, 165, 25, "female");
      expect(bmr).toBe(1395);
    });

    it("returns 0 for invalid weight", () => {
      expect(calculateBMR(0, 180, 30, "male")).toBe(0);
      expect(calculateBMR(-10, 180, 30, "male")).toBe(0);
    });

    it("returns 0 for invalid height", () => {
      expect(calculateBMR(80, 0, 30, "male")).toBe(0);
    });

    it("returns 0 for invalid age", () => {
      expect(calculateBMR(80, 180, 0, "male")).toBe(0);
    });

    it("male has higher BMR than female with same stats", () => {
      const maleBMR = calculateBMR(80, 180, 30, "male");
      const femaleBMR = calculateBMR(80, 180, 30, "female");
      expect(maleBMR).toBeGreaterThan(femaleBMR);
    });
  });

  describe("calculateTDEE", () => {
    it("calculates TDEE from BMR and multiplier", () => {
      expect(calculateTDEE(1800, 1.2)).toBe(2160);
      expect(calculateTDEE(1800, 1.55)).toBe(2790);
      expect(calculateTDEE(1800, 1.9)).toBe(3420);
    });

    it("returns 0 for zero BMR", () => {
      expect(calculateTDEE(0, 1.55)).toBe(0);
    });
  });
});
