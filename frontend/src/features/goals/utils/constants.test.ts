import { describe, expect, it } from "vitest";

import { CALORIE_ADJUSTMENT_FACTORS, DEFAULT_CALORIE_ADJUSTMENT } from "./constants";

describe("goals constants", () => {
  it("has calorie adjustment factors", () => {
    expect(CALORIE_ADJUSTMENT_FACTORS).toBeDefined();
  });

  it("has default calorie adjustment", () => {
    expect(typeof DEFAULT_CALORIE_ADJUSTMENT).toBe("number");
  });
});
