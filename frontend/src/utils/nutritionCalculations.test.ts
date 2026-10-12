import { describe, expect, it } from "vitest";

import {
  calculateBMR,
  calculateCaloriePercentages,
  calculateCaloriesFromMacros,
  calculateCarbsCalories,
  calculateDailyTotals,
  calculateFatsCalories,
  calculateGoalRate,
  calculateMacroTarget,
  calculateProteinCalories,
  calculateTDEE,
  caloriesFromMacrosRaw,
  caloriesFromMacrosRounded,
  clampGoalRatePercent,
  generateWeightGoalCalculations,
  goalRatePercentFromWeeklyChange,
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
      expect(
        result.proteinPercent + result.carbsPercent + result.fatsPercent,
      ).toBeGreaterThan(95);
    });
  });

  describe("calculateMacroTarget", () => {
    it("calculates targets from calories and percentages", () => {
      const result = calculateMacroTarget(2000, 30, 40, 30);
      expect(result.proteinTarget).toBe(150); // 2000 * 0.3 / 4 = 150
      expect(result.carbsTarget).toBe(200); // 2000 * 0.4 / 4 = 200
      expect(result.fatsTarget).toBe(67); // 2000 * 0.3 / 9 = 66.67 -> 67
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

  describe("calculateGoalRate", () => {
    it("turns 0.5% of 80 kg into 0.4 kg and 440 kcal a day below", () => {
      expect(calculateGoalRate(80, "lose", 0.5)).toEqual({
        weeklyChange: -0.4,
        dailyCalorieChange: -440,
      });
    });

    it("turns 0.25% of 80 kg into 0.2 kg and 220 kcal a day above", () => {
      expect(calculateGoalRate(80, "gain", 0.25)).toEqual({
        weeklyChange: 0.2,
        dailyCalorieChange: 220,
      });
    });

    it("scales with body weight", () => {
      expect(calculateGoalRate(60, "lose", 0.5).dailyCalorieChange).toBe(-330);
      expect(calculateGoalRate(120, "lose", 0.5).dailyCalorieChange).toBe(-660);
    });

    it("is zero for maintenance", () => {
      expect(calculateGoalRate(80, "maintain", 0.5)).toEqual({
        weeklyChange: 0,
        dailyCalorieChange: 0,
      });
    });
  });

  describe("clampGoalRatePercent", () => {
    it("keeps the rate inside each direction's range", () => {
      expect(clampGoalRatePercent("lose", 2)).toBe(1);
      expect(clampGoalRatePercent("lose", 0.1)).toBe(0.25);
      expect(clampGoalRatePercent("gain", 1)).toBe(0.5);
      expect(clampGoalRatePercent("gain", 0)).toBe(0.1);
    });

    it("snaps to the 0.05% step", () => {
      expect(clampGoalRatePercent("lose", 0.625)).toBe(0.65);
      expect(clampGoalRatePercent("gain", 0.14)).toBe(0.15);
    });
  });

  describe("goalRatePercentFromWeeklyChange", () => {
    it("reads 0.4 kg a week at 80 kg back as 0.5%", () => {
      expect(goalRatePercentFromWeeklyChange("lose", -0.4, 80)).toBe(0.5);
    });

    it("ignores the sign older goals stored", () => {
      expect(goalRatePercentFromWeeklyChange("lose", 0.6, 80)).toBe(0.75);
      expect(goalRatePercentFromWeeklyChange("gain", -0.2, 80)).toBe(0.25);
    });

    it("clamps a stored rate outside the range", () => {
      expect(goalRatePercentFromWeeklyChange("lose", 1.5, 80)).toBe(1);
      expect(goalRatePercentFromWeeklyChange("gain", 0.04, 80)).toBe(0.1);
    });

    it("falls back to the default when nothing usable is stored", () => {
      expect(goalRatePercentFromWeeklyChange("lose", 0, 80)).toBe(0.5);
      expect(goalRatePercentFromWeeklyChange("gain", 0.2, undefined)).toBe(
        0.25,
      );
      expect(goalRatePercentFromWeeklyChange("maintain", 0.2, 80)).toBe(0);
    });
  });

  describe("generateWeightGoalCalculations", () => {
    it("uses the default lose rate: 80 kg to 75 kg at 2,500 kcal", () => {
      expect(generateWeightGoalCalculations(2500, 80, 75)).toMatchObject({
        weightGoal: "lose",
        ratePercent: 0.5,
        weeklyChange: -0.4,
        dailyChange: -440,
        calorieTarget: 2060,
        calculatedWeeks: 13,
      });
    });

    it("uses the default gain rate: 80 kg to 84 kg at 2,500 kcal", () => {
      expect(generateWeightGoalCalculations(2500, 80, 84)).toMatchObject({
        weightGoal: "gain",
        ratePercent: 0.25,
        weeklyChange: 0.2,
        dailyChange: 220,
        calorieTarget: 2720,
        calculatedWeeks: 20,
      });
    });

    it("bases the rate on the current weight when given", () => {
      expect(generateWeightGoalCalculations(2500, 90, 70, 1, 80)).toMatchObject(
        { weeklyChange: -0.8, dailyChange: -880 },
      );
    });

    it("targets maintenance calories when maintaining", () => {
      expect(generateWeightGoalCalculations(2500, 80, 80)).toMatchObject({
        weightGoal: "maintain",
        calorieTarget: 2500,
        weeklyChange: 0,
        dailyChange: 0,
      });
    });
  });
});
