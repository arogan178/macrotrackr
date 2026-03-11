import { describe, expect, it } from "vitest";

import { CALORIES_PER_GRAM, DEFAULT_MACRO_TOTALS } from "./nutrition";

describe("nutrition constants", () => {
  describe("CALORIES_PER_GRAM", () => {
    it("has correct protein calories", () => {
      expect(CALORIES_PER_GRAM.protein).toBe(4);
    });

    it("has correct carbs calories", () => {
      expect(CALORIES_PER_GRAM.carbs).toBe(4);
    });

    it("has correct fats calories", () => {
      expect(CALORIES_PER_GRAM.fats).toBe(9);
    });
  });

  describe("DEFAULT_MACRO_TOTALS", () => {
    it("has zero protein default", () => {
      expect(DEFAULT_MACRO_TOTALS.protein).toBe(0);
    });

    it("has zero carbs default", () => {
      expect(DEFAULT_MACRO_TOTALS.carbs).toBe(0);
    });

    it("has zero fats default", () => {
      expect(DEFAULT_MACRO_TOTALS.fats).toBe(0);
    });

    it("has zero calories default", () => {
      expect(DEFAULT_MACRO_TOTALS.calories).toBe(0);
    });
  });
});
