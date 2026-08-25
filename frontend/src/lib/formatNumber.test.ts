import { describe, expect, it } from "vitest";

import { formatGrouped } from "./formatNumber";

describe("formatGrouped", () => {
  it("groups thousands, which is the house standard", () => {
    expect(formatGrouped(2000)).toBe("2,000");
    expect(formatGrouped(12_345)).toBe("12,345");
  });

  it("leaves figures under a thousand alone", () => {
    expect(formatGrouped(950)).toBe("950");
  });

  it("holds the decimals it is given", () => {
    expect(formatGrouped(1234.56, 1)).toBe("1,234.6");
    expect(formatGrouped(80.64, 1)).toBe("80.6");
  });

  it("prints zero rather than NaN for a figure that is not one", () => {
    expect(formatGrouped(Number.NaN)).toBe("0");
    expect(formatGrouped(Number.POSITIVE_INFINITY)).toBe("0");
  });
});
