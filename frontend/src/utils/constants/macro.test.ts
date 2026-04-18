import { describe, expect, it } from "vitest";

import { DEFAULT_MACRO_TARGET,MACRO_PERCENTAGE_KEYS } from "./macro";

describe("macro constants", () => {
  describe("MACRO_PERCENTAGE_KEYS", () => {
    it("contains proteinPercentage", () => {
      expect(MACRO_PERCENTAGE_KEYS).toContain("proteinPercentage");
    });

    it("contains carbsPercentage", () => {
      expect(MACRO_PERCENTAGE_KEYS).toContain("carbsPercentage");
    });

    it("contains fatsPercentage", () => {
      expect(MACRO_PERCENTAGE_KEYS).toContain("fatsPercentage");
    });

    it("has exactly 3 keys", () => {
      expect(MACRO_PERCENTAGE_KEYS).toHaveLength(3);
    });
  });

  describe("DEFAULT_MACRO_TARGET", () => {
    it("has proteinPercentage of 30", () => {
      expect(DEFAULT_MACRO_TARGET.proteinPercentage).toBe(30);
    });

    it("has carbsPercentage of 40", () => {
      expect(DEFAULT_MACRO_TARGET.carbsPercentage).toBe(40);
    });

    it("has fatsPercentage of 30", () => {
      expect(DEFAULT_MACRO_TARGET.fatsPercentage).toBe(30);
    });

    it("has empty lockedMacros array", () => {
      expect(DEFAULT_MACRO_TARGET.lockedMacros).toEqual([]);
    });

    it("percentages sum to 100", () => {
      const sum =
        DEFAULT_MACRO_TARGET.proteinPercentage +
        DEFAULT_MACRO_TARGET.carbsPercentage +
        DEFAULT_MACRO_TARGET.fatsPercentage;
      expect(sum).toBe(100);
    });
  });
});
