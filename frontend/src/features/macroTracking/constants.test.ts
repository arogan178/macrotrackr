import { describe, expect, it } from "vitest";

import { DEFAULT_MACRO_TOTALS, MEAL_TYPE_OPTIONS } from "./constants";

describe("macroTracking constants", () => {
  it("has meal types", () => {
    expect(MEAL_TYPE_OPTIONS).toBeDefined();
    expect(MEAL_TYPE_OPTIONS.length).toBeGreaterThan(0);
  });

  it("has macro ratios", () => {
    expect(DEFAULT_MACRO_TOTALS).toBeDefined();
  });
});
