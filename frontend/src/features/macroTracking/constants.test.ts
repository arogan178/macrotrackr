import { describe, expect, it } from "vitest";

import { MEAL_TYPES, MACRO_RATIOS } from "./constants";

describe("macroTracking constants", () => {
  it("has meal types", () => {
    expect(MEAL_TYPES).toBeDefined();
    expect(MEAL_TYPES.length).toBeGreaterThan(0);
  });

  it("has macro ratios", () => {
    expect(MACRO_RATIOS).toBeDefined();
  });
});
