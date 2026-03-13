import { describe, expect, it } from "vitest";

import { calculateConsistencyScore } from "./insightsCalculations";

describe("insightsCalculations", () => {
  describe("calculateConsistencyScore", () => {
    it("returns 0 for empty data", () => {
      expect(calculateConsistencyScore([])).toBe(0);
    });

    it("calculates score for consistent data", () => {
      const data = [
        { name: "Day 1", date: "2024-01-01", calories: 2000, protein: 100, carbs: 200, fats: 70 },
        { name: "Day 2", date: "2024-01-02", calories: 2000, protein: 100, carbs: 200, fats: 70 },
        { name: "Day 3", date: "2024-01-03", calories: 2000, protein: 100, carbs: 200, fats: 70 },
      ];
      const score = calculateConsistencyScore(data);
      expect(score).toBeGreaterThan(0);
    });
  });
});
