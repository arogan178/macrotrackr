import { describe, expect, it } from "vitest";

import {
  ACTIVITY_LEVELS,
  GENDER_OPTIONS,
  getActivityLevelLabel,
  getActivityLevelMultiplier,
  getActivityLevelValue,
} from "./userConstants";

describe("userConstants", () => {
  describe("GENDER_OPTIONS", () => {
    it("contains expected options", () => {
      expect(GENDER_OPTIONS).toHaveLength(3);
      expect(GENDER_OPTIONS[0].value).toBe("");
      expect(GENDER_OPTIONS[1].value).toBe("male");
      expect(GENDER_OPTIONS[2].value).toBe("female");
    });
  });

  describe("ACTIVITY_LEVELS", () => {
    it("contains 5 activity levels", () => {
      expect(Object.keys(ACTIVITY_LEVELS)).toHaveLength(5);
    });

    it("never lets a sedentary day equal the resting burn", () => {
      // A multiplier of 1 made TDEE identical to BMR, which is not a thing a
      // body does: digestion and incidental movement are ~20% on their own.
      expect(ACTIVITY_LEVELS[1].multiplier).toBe(1.2);
    });

    it("has correct multiplier for athlete", () => {
      expect(ACTIVITY_LEVELS[5].multiplier).toBe(1.9);
    });
  });

  describe("getActivityLevelLabel", () => {
    it("returns label for valid level", () => {
      expect(getActivityLevelLabel(1)).toBe("Sedentary (little or no exercise)");
    });

    it("returns empty string for invalid level", () => {
      expect(getActivityLevelLabel(99)).toBe("Unknown");
    });
  });

  describe("getActivityLevelValue", () => {
    it("returns value for valid level", () => {
      expect(getActivityLevelValue(1)).toBe("sedentary");
    });
  });

  describe("getActivityLevelMultiplier", () => {
    it("returns multiplier for valid level", () => {
      expect(getActivityLevelMultiplier(1)).toBe(1.2);
    });

    it("falls back to the sedentary floor, not to 1", () => {
      expect(getActivityLevelMultiplier(99)).toBe(1.2);
    });
  });
});
