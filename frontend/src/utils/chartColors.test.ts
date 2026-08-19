import { describe, expect, it } from "vitest";

import {
  getUnitForStat,
  MACRO_COLORS,
  MEAL_COLORS,
  STAT_COLORS,
} from "./chartColors";

describe("chartColors", () => {
  describe("MACRO_COLORS", () => {
    // These used to assert the hex. That is the shape of assertion that let the
    // Clerk theme and the snapshot canvas sit on a stale palette for months: it
    // pins a copy instead of the link to the source. Each series must name a
    // token the stylesheet declares.
    it.each(["protein", "carbs", "fats"] as const)(
      "names the %s token rather than copying its value",
      (macro) => {
        expect(MACRO_COLORS[macro]).toBeDefined();
        expect(MACRO_COLORS[macro].base).toBe(`var(--color-${macro})`);
      },
    );

    it("holds no hex of its own", () => {
      expect(JSON.stringify(MACRO_COLORS)).not.toMatch(/#[\dA-Fa-f]{3,8}/);
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
      expect(STAT_COLORS.protein).toBe("bg-protein");
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
