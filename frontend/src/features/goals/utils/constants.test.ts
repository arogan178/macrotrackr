import { describe, expect, it } from "vitest";

import { CALORIE_ADJUSTMENT_FACTORS } from "../constants";

describe("goals constants", () => {
  it("has calorie adjustment factors", () => {
    expect(CALORIE_ADJUSTMENT_FACTORS).toBeDefined();
  });

  it("has default calorie adjustment", () => {
    expect(CALORIE_ADJUSTMENT_FACTORS.maintain).toBe(0);
  });
});
