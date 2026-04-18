import { describe, expect, it } from "vitest";

import { getRangeDescription } from "./chartUtilities";

describe("chartUtilities", () => {
  describe("getRangeDescription", () => {
    it("returns correct description for 7 days", () => {
      expect(getRangeDescription(7)).toBe("Last 7 Days");
    });

    it("returns correct description for 30 days", () => {
      expect(getRangeDescription(30)).toBe("Last 30 Days");
    });

    it("returns correct description for 90 days", () => {
      expect(getRangeDescription(90)).toBe("Last 90 Days");
    });
  });
});
