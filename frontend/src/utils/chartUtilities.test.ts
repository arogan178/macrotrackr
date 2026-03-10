import { describe, expect, it } from "vitest";

import { getRangeDescription } from "./chartUtilities";

describe("chartUtilities", () => {
  describe("getRangeDescription", () => {
    it("returns correct description", () => {
      expect(getRangeDescription(7)).toBe("Last 7 Days");
      expect(getRangeDescription(30)).toBe("Last 30 Days");
    });

    it("handles default", () => {
      expect(getRangeDescription()).toBe("Last 7 Days");
    });
  });
});
