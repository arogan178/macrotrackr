import { describe, expect, it } from "vitest";

import { targetStatus } from "./targetStatus";

describe("targetStatus", () => {
  it("is empty when nothing is logged", () => {
    expect(targetStatus(0, 2000)).toBe("empty");
  });

  it("counts 10% either side of the target as on target", () => {
    expect(targetStatus(1800, 2000)).toBe("hit");
    expect(targetStatus(2200, 2000)).toBe("hit");
  });

  it("is under below the band and over above it", () => {
    expect(targetStatus(1799, 2000)).toBe("under");
    expect(targetStatus(2201, 2000)).toBe("over");
  });

  it("is under, never over, without a target", () => {
    expect(targetStatus(500, 0)).toBe("under");
  });
});
