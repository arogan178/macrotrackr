import { describe, expect, it } from "vitest";

import { calculateWeeklyAverageChange } from "./progressAnalytics";

describe("progressAnalytics", () => {
  describe("calculateWeeklyAverageChange", () => {
    it("returns undefined for empty log", () => {
      expect(calculateWeeklyAverageChange([])).toBeUndefined();
    });

    it("returns undefined for single entry", () => {
      const log = [{ timestamp: new Date().toISOString(), weight: 70 }];
      expect(calculateWeeklyAverageChange(log)).toBeUndefined();
    });

    it("calculates change for recent entries", () => {
      const now = new Date();
      const week1 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
      const week2 = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const log = [
        { timestamp: week1.toISOString(), weight: 75 },
        { timestamp: week2.toISOString(), weight: 74 },
      ];

      const result = calculateWeeklyAverageChange(log);
      expect(result).toBeDefined();
    });
  });
});
