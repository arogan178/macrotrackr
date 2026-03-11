import { describe, expect, it } from "vitest";
import {
  MACRO_COLORS,
  MEAL_COLORS,
  STAT_COLORS,
  getUnitForStat,
} from "./chartColors";

describe("chartColors", () => {
  describe("MACRO_COLORS", () => {
    it("should have protein color defined", () => {
      expect(MACRO_COLORS.protein).toBeDefined();
      expect(MACRO_COLORS.protein.base).toBe("#34d399");
    });

    it("should have carbs color defined", () => {
      expect(MACRO_COLORS.carbs).toBeDefined();
      expect(MACRO_COLORS.carbs.base).toBe("#60a5fa");
    });

    it("should have fats color defined", () => {
      expect(MACRO_COLORS.fats).toBeDefined();
      expect(MACRO_COLORS.fats.base).toBe("#f87171");
    });
  });

  describe("MEAL_COLORS", () => {
    it("should have breakfast color defined", () => {
      expect(MEAL_COLORS.breakfast).toBeDefined();
    });

    it("should have lunch color defined", () => {
      expect(MEAL_COLORS.lunch).toBeDefined();
    });

    it("should have dinner color defined", () => {
      expect(MEAL_COLORS.dinner).toBeDefined();
    });

    it("should have snack color defined", () => {
      expect(MEAL_COLORS.snack).toBeDefined();
    });
  });

  describe("STAT_COLORS", () => {
    it("should have calories color defined", () => {
      expect(STAT_COLORS.calories).toBe("bg-primary");
    });

    it("should have protein color defined", () => {
      expect(STAT_COLORS.protein).toBe("bg-primary");
    });
  });

  describe("getUnitForStat", () => {
    it("returns kcal for calories", () => {
      expect(getUnitForStat("calories")).toBe("kcal");
    });

    it("returns g for protein", () => {
      expect(getUnitForStat("protein")).toBe("g");
    });

    it("returns g for carbs", () => {
      expect(getUnitForStat("carbs")).toBe("g");
    });

    it("returns g for fats", () => {
      expect(getUnitForStat("fats")).toBe("g");
    });

    it("returns empty string for unknown stat type", () => {
      expect(getUnitForStat("unknown")).toBe("");
    });
  });
});
