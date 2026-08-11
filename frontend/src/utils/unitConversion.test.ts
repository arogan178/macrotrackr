import { describe, expect, it } from "vitest";

import {
  cmToFtIn,
  ftInToCm,
  kgToLb,
  lbToKg,
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
});
