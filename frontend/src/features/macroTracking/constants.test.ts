import { describe, expect, it } from "vitest";
import { MEAL_TYPE_OPTIONS, getMealTypeDisplay, getTodayDateString } from "./constants";

type MealType = "breakfast" | "lunch" | "dinner" | "snack";

describe("constants", () => {
  describe("MEAL_TYPE_OPTIONS", () => {
    it("should have 4 meal type options", () => {
      expect(MEAL_TYPE_OPTIONS).toHaveLength(4);
    });

    it("should include breakfast, lunch, dinner, snack", () => {
      const values = MEAL_TYPE_OPTIONS.map((opt) => opt.value);
      expect(values).toContain("breakfast");
      expect(values).toContain("lunch");
      expect(values).toContain("dinner");
      expect(values).toContain("snack");
    });

    it("should have display names for each option", () => {
      for (const option of MEAL_TYPE_OPTIONS) {
        expect(option.display).toBeTruthy();
        expect(typeof option.display).toBe("string");
      }
    });
  });

  describe("getMealTypeDisplay", () => {
    it("should return display name for breakfast", () => {
      expect(getMealTypeDisplay("breakfast" as MealType)).toBe("Breakfast");
    });

    it("should return display name for lunch", () => {
      expect(getMealTypeDisplay("lunch" as MealType)).toBe("Lunch");
    });

    it("should return display name for dinner", () => {
      expect(getMealTypeDisplay("dinner" as MealType)).toBe("Dinner");
    });

    it("should return display name for snack", () => {
      expect(getMealTypeDisplay("snack" as MealType)).toBe("Snack");
    });

    it("should return the input if no matching option found", () => {
      expect(getMealTypeDisplay("unknown" as MealType)).toBe("unknown");
    });
  });

  describe("getTodayDateString", () => {
    it("should return a date string in YYYY-MM-DD format", () => {
      const result = getTodayDateString();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });

    it("should return today's date", () => {
      const today = new Date().toISOString().split("T")[0];
      expect(getTodayDateString()).toBe(today);
    });
  });
});
