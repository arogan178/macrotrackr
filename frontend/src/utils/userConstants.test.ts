import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  ACTIVITY_LEVELS,
  createNutritionProfile,
  GENDER_OPTIONS,
  getActivityLevelLabel,
  getActivityLevelMultiplier,
  getActivityLevelValue,
  maintenanceLabel,
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

  describe("createNutritionProfile", () => {
    // 80 kg, 180 cm, male, 36, moderately active: BMR 1,750, TDEE 1,750 x 1.55.
    beforeEach(() => vi.useFakeTimers({ now: new Date("2026-10-12T12:00:00Z") }));
    afterEach(() => vi.useRealTimers());

    const source = {
      id: 1,
      weight: 80,
      height: 180,
      dateOfBirth: "1990-01-01",
      gender: "male" as const,
      activityLevel: 3,
    };

    it("uses the formula when there is no override", () => {
      const profile = createNutritionProfile({ ...source, expenditureOverride: null });

      expect(profile.bmr).toBe(1750);
      expect(profile.tdee).toBe(2713);
      expect(profile.tdeeIsOverride).toBe(false);
      expect(maintenanceLabel(profile.tdeeIsOverride)).toBe("Formula estimate");
    });

    it("uses the user's own number when set, and keeps the formula BMR", () => {
      const profile = createNutritionProfile({ ...source, expenditureOverride: 2500 });

      expect(profile.tdee).toBe(2500);
      expect(profile.bmr).toBe(1750);
      expect(profile.tdeeIsOverride).toBe(true);
      expect(maintenanceLabel(profile.tdeeIsOverride)).toBe("Your number");
    });
  });
});
