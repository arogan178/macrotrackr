import { describe, expect, it } from "vitest";

import { calculateAge, calculateMacros } from "./calculations";

describe("settings calculations", () => {
  describe("calculateMacros", () => {
    it("calculates macros correctly", () => {
      const result = calculateMacros(2000, 30, 40, 30);
      expect(result).toBeDefined();
      expect(result.protein).toBeGreaterThan(0);
      expect(result.carbs).toBeGreaterThan(0);
      expect(result.fats).toBeGreaterThan(0);
    });

    it("returns zero macros for zero calories", () => {
      const result = calculateMacros(0, 30, 40, 30);
      expect(result.protein).toBe(0);
      expect(result.carbs).toBe(0);
      expect(result.fats).toBe(0);
    });
  });

  describe("calculateAge", () => {
    it("calculates age correctly", () => {
      const date = new Date();
      date.setFullYear(date.getFullYear() - 25);
      const age = calculateAge(date.toISOString().split("T")[0]);
      expect(age).toBe(25);
    });

    it("returns 0 for empty string", () => {
      expect(calculateAge("")).toBe(0);
    });
  });
});
