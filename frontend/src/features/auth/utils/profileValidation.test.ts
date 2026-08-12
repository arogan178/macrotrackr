import { describe, expect, it } from "vitest";

import { validateGoalStep } from "./profileValidation";

describe("validateGoalStep", () => {
  it("requires a goal to be picked", () => {
    expect(validateGoalStep("", null, 80)).toEqual({
      weightGoal: "Pick a goal to continue",
    });
  });

  it("accepts maintain without a target weight", () => {
    expect(validateGoalStep("maintain", null, 80)).toEqual({});
  });

  it("requires a target weight for lose and gain", () => {
    expect(validateGoalStep("lose", null, 80).targetWeight).toBe(
      "Target weight is required",
    );
    expect(validateGoalStep("gain", null, 80).targetWeight).toBe(
      "Target weight is required",
    );
  });

  it("rejects a target outside the supported range", () => {
    expect(validateGoalStep("lose", 1, 80).targetWeight).toMatch(
      /valid weight/,
    );
    expect(validateGoalStep("gain", 9999, 80).targetWeight).toMatch(
      /valid weight/,
    );
  });

  it("rejects a target that contradicts the chosen direction", () => {
    expect(validateGoalStep("lose", 85, 80).targetWeight).toMatch(/under 80/);
    expect(validateGoalStep("lose", 80, 80).targetWeight).toMatch(/under 80/);
    expect(validateGoalStep("gain", 75, 80).targetWeight).toMatch(/over 80/);
    expect(validateGoalStep("gain", 80, 80).targetWeight).toMatch(/over 80/);
  });

  it("accepts a target consistent with the chosen direction", () => {
    expect(validateGoalStep("lose", 75, 80)).toEqual({});
    expect(validateGoalStep("gain", 85, 80)).toEqual({});
  });

  it("skips the direction check when current weight is unknown", () => {
    expect(validateGoalStep("lose", 85, null)).toEqual({});
  });
});
