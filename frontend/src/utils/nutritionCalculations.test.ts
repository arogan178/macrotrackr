import { describe, expect, it } from "vitest";
import {
  caloriesFromMacrosRaw,
  caloriesFromMacrosRounded,
  calculateProteinCalories,
  calculateCarbsCalories,
  calculateFatsCalories,
} from "./nutritionCalculations";

describe("nutritionCalculations", () => {
  describe("caloriesFromMacrosRaw", () => {
    it("calculates calories from macros", () => {
      const calories = caloriesFromMacrosRaw(100, 200, 50);
      // protein: 100*4=400, carbs: 200*4=800, fats: 50*9=450
      expect(calories).toBe(1650);
    });

    it("handles zero values", () => {
      const calories = caloriesFromMacrosRaw(0, 0, 0);
      expect(calories).toBe(0);
    });
  });

  describe("caloriesFromMacrosRounded", () => {
    it("rounds calories to nearest integer", () => {
      const calories = caloriesFromMacrosRounded(100.5, 200.5, 50.5);
      // 100.5*4 + 200.5*4 + 50.5*9 = 402 + 802 + 454.5 = 1658.5 → rounds to 1659
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
});
