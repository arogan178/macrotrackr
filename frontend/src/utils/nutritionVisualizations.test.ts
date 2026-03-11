import { describe, expect, it } from "vitest";
import { formatMealType, MEAL_TYPES } from "./nutritionVisualizations";

describe("nutritionVisualizations", () => {
  describe("MEAL_TYPES", () => {
    it("contains all meal types", () => {
      expect(MEAL_TYPES).toContain("breakfast");
      expect(MEAL_TYPES).toContain("lunch");
      expect(MEAL_TYPES).toContain("dinner");
      expect(MEAL_TYPES).toContain("snack");
    });
  });

  describe("formatMealType", () => {
    it("capitalizes meal type", () => {
      expect(formatMealType("breakfast")).toBe("Breakfast");
      expect(formatMealType("lunch")).toBe("Lunch");
      expect(formatMealType("dinner")).toBe("Dinner");
      expect(formatMealType("snack")).toBe("Snack");
    });
  });
});
