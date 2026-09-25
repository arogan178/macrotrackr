import { describe, expect, it } from "vitest";

import {
  cmToFtIn,
  formatHeightRange,
  formatWeight,
  formatWeightRange,
  fromKg,
  ftInToCm,
  kgToLb,
  lbToKg,
  toKg,
  weightLimits,
} from "./unitConversion";

describe("unitConversion", () => {
  it("converts kg to lb and back with acceptable precision", () => {
    expect(kgToLb(75)).toBe(165.3);
    expect(lbToKg(165.3)).toBe(75);
  });

  it("handles zero and invalid inputs for weight", () => {
    expect(kgToLb(0)).toBe(0);
    expect(lbToKg(0)).toBe(0);
  });

  it("converts cm to feet and inches correctly", () => {
    expect(cmToFtIn(175)).toEqual({ feet: 5, inches: 9 });
    expect(cmToFtIn(180)).toEqual({ feet: 5, inches: 11 });
  });

  it("converts feet and inches to cm correctly", () => {
    expect(ftInToCm(5, 9)).toBe(175);
    expect(ftInToCm(5, 11)).toBe(180);
  });

  it("round-trips height within 1 cm", () => {
    const { feet, inches } = cmToFtIn(175);
    expect(ftInToCm(feet, inches)).toBe(175);
  });

  it("stores a typed lb weight precisely enough to read back unchanged", () => {
    for (let tenths = 1000; tenths <= 6600; tenths += 1) {
      const typed = tenths / 10;
      expect(kgToLb(toKg(typed, "imperial"))).toBe(typed);
    }
  });

  it("leaves metric weights untouched", () => {
    expect(toKg(75.55, "metric")).toBe(75.55);
    expect(fromKg(75.55, "metric")).toBe(75.55);
  });

  it("formats a metric weight in the chosen unit", () => {
    expect(formatWeight(75, "metric")).toBe("75.0 kg");
    expect(formatWeight(75, "imperial")).toBe("165.3 lb");
    expect(formatWeight(0.5, "imperial", 2)).toBe("1.10 lb");
  });

  it("states limits the metric validation accepts", () => {
    const { min, max } = weightLimits(50, 300, "imperial");
    expect({ min, max }).toEqual({ min: 111, max: 661 });
    expect(toKg(min, "imperial")).toBeGreaterThanOrEqual(50);
    expect(toKg(max, "imperial")).toBeLessThanOrEqual(300);
    expect(formatWeightRange(50, 300, "metric")).toBe("50-300 kg");
    expect(formatWeightRange(50, 300, "imperial")).toBe("111-661 lb");
  });

  it("states height limits in feet and inches", () => {
    expect(formatHeightRange(120, 250, "metric")).toBe("120-250 cm");
    expect(formatHeightRange(120, 250, "imperial")).toBe(
      "4 ft 0 in-8 ft 2 in",
    );
    expect(ftInToCm(4, 0)).toBeGreaterThanOrEqual(120);
    expect(ftInToCm(8, 2)).toBeLessThanOrEqual(250);
  });

  it("round-trips every whole-inch height exactly", () => {
    for (let totalInches = 48; totalInches <= 98; totalInches += 1) {
      const cm = ftInToCm(Math.floor(totalInches / 12), totalInches % 12);
      const { feet, inches } = cmToFtIn(cm);
      expect(feet * 12 + inches).toBe(totalInches);
    }
  });
});
