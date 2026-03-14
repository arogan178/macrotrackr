import { describe, expect, it } from "vitest";

import { MACRO_RATIOS,MEAL_TYPES } from "./constants";

describe("macroTracking constants", () => {
  it("has meal types", () => {
    expect(MEAL_TYPES).toBeDefined();
    expect(MEAL_TYPES.length).toBeGreaterThan(0);
  });

  it("has macro ratios", () => {
    expect(MACRO_RATIOS).toBeDefined();
  });
});
