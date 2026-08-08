import { describe, expect, it } from "vitest";
import { getLocalDate } from "../../src/lib/utils/dates";

describe("dates", () => {
  describe("getLocalDate", () => {
    it("returns date in YYYY-MM-DD format", () => {
      const result = getLocalDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});
