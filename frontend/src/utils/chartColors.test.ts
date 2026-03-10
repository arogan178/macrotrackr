import { describe, expect, it } from "vitest";

import { MACRO_COLORS, MEAL_COLORS, getUnitForStat } from "./chartColors";

describe("chartColors", () => {
  describe("MACRO_COLORS", () => {
    it("contains protein color", () => {
      expect(MACRO_COLORS.protein).toBeDefined();
      expect(MACRO_COLORS.protein.base).toBe("#34d399");
    });

    it("contains carbs color", () => {
      expect(MACRO_COLORS.carbs).toBeDefined();
      expect(MACRO_COLORS.carbs.base).toBe("#60a5fa");
    });

    it("contains fats color", () => {
      expect(MACRO_COLORS.fats).toBeDefined();
      expect(MACRO_COLORS.fats.base).toBe("#f87171");
    });
  });

  describe("MEAL_COLORS", () => {
    it("contains breakfast color", () => {
      expect(MEAL_COLORS.breakfast).toBeDefined();
    });

    it("contains lunch color", () => {
      expect(MEAL_COLORS.lunch).toBeDefined();
    });

    it("contains dinner color", () => {
      expect(MEAL_COLORS.dinner).toBeDefined();
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

    it("returns empty string for unknown stat", () => {
      expect(getUnitForStat("unknown")).toBe("");
    });
  });
});
