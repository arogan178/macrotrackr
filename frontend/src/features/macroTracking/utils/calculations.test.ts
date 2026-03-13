import { describe, expect, it } from "vitest";

import { calculateCaloriesFromMacros } from "../calculations";

describe("macroTracking calculations", () => {
  describe("calculateCaloriesFromMacros", () => {
    it("calculates calories from macros", () => {
      expect(calculateCaloriesFromMacros(100, 100, 100)).toBe(1700);
    });

    it("handles zero values", () => {
      expect(calculateCaloriesFromMacros(0, 0, 0)).toBe(0);
    });

    it("calculates protein only", () => {
      expect(calculateCaloriesFromMacros(50, 0, 0)).toBe(200);
    });

    it("calculates carbs only", () => {
      expect(calculateCaloriesFromMacros(0, 50, 0)).toBe(200);
    });

    it("calculates fats only", () => {
      expect(calculateCaloriesFromMacros(0, 0, 50)).toBe(450);
    });
  });
});
