import { describe, expect, it } from "vitest";

import { redistributeMacroPercentages } from "./macroRedistribution";

describe("redistributeMacroPercentages", () => {
  it("redistributes proportionally when one macro increases", () => {
    const initial = {
      proteinPercentage: 30,
      carbsPercentage: 40,
      fatsPercentage: 30,
    };
    const result = redistributeMacroPercentages("protein", 50, initial);
    expect(result.proteinPercentage).toBe(50);
    expect(
      result.proteinPercentage + result.carbsPercentage + result.fatsPercentage,
    ).toBe(100);
  });

  it("respects locked macros", () => {
    const initial = {
      proteinPercentage: 30,
      carbsPercentage: 40,
      fatsPercentage: 30,
    };
    const result = redistributeMacroPercentages("protein", 50, initial, [
      "fats",
    ]);
    expect(result.proteinPercentage).toBe(50);
    expect(result.fatsPercentage).toBe(30);
    expect(result.carbsPercentage).toBe(20);
  });

  it("keeps total at 100 on extreme inputs", () => {
    const initial = {
      proteinPercentage: 30,
      carbsPercentage: 40,
      fatsPercentage: 30,
    };
    const result = redistributeMacroPercentages("protein", 100, initial);
    expect(result.proteinPercentage).toBe(100);
    expect(result.carbsPercentage).toBe(0);
    expect(result.fatsPercentage).toBe(0);
  });

  it("clamps changed macro to available budget when another macro is locked", () => {
    const initial = {
      proteinPercentage: 30,
      carbsPercentage: 40,
      fatsPercentage: 30,
    };
    // Fats locked at 30%, so max available for protein + carbs is 70%
    const result = redistributeMacroPercentages("protein", 80, initial, [
      "fats",
    ]);
    expect(result.proteinPercentage).toBe(70);
    expect(result.fatsPercentage).toBe(30);
    expect(result.carbsPercentage).toBe(0);
    expect(
      result.proteinPercentage + result.carbsPercentage + result.fatsPercentage,
    ).toBe(100);
  });

  it("returns unchanged state when changed macro or all remaining macros are locked", () => {
    const initial = {
      proteinPercentage: 30,
      carbsPercentage: 40,
      fatsPercentage: 30,
    };
    // Trying to change protein when protein is locked
    const result1 = redistributeMacroPercentages("protein", 50, initial, [
      "protein",
    ]);
    expect(result1).toEqual(initial);

    // Trying to change protein when carbs AND fats are locked
    const result2 = redistributeMacroPercentages("protein", 50, initial, [
      "carbs",
      "fats",
    ]);
    expect(result2).toEqual(initial);
  });
});
