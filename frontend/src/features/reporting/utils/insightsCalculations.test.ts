import { describe, expect, it } from "vitest";

import {
  calculateConsistencyScore,
  calculateDataQuality,
  calculateTrend,
  generateOverallTrendSummary,
} from "./insightsCalculations";

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

  describe("calculateTrend", () => {
    it("returns insufficient for less than required days", () => {
      const result = calculateTrend([], "calories");
      expect(result.direction).toBe("insufficient");
      expect(result.unit).toBe("kcal");
    });

    it("calculates upward trend and baseline statistics accurately", () => {
      const data = [
        { name: "D1", calories: 2000, protein: 100, carbs: 200, fats: 60 },
        { name: "D2", calories: 2000, protein: 100, carbs: 200, fats: 60 },
        { name: "D3", calories: 2000, protein: 100, carbs: 200, fats: 60 },
        { name: "D4", calories: 2500, protein: 120, carbs: 250, fats: 70 },
        { name: "D5", calories: 2500, protein: 120, carbs: 250, fats: 70 },
        { name: "D6", calories: 2500, protein: 120, carbs: 250, fats: 70 },
        { name: "D7", calories: 2500, protein: 120, carbs: 250, fats: 70 },
      ];

      const calTrend = calculateTrend(data, "calories");
      expect(calTrend.direction).toBe("up");
      expect(calTrend.firstAvg).toBe(2000);
      expect(calTrend.lastAvg).toBe(2500);
      expect(calTrend.delta).toBe(500);
      expect(calTrend.percentage).toBe(25);
    });
  });

  describe("generateOverallTrendSummary", () => {
    it("generates summary message based on macro trends", () => {
      const calTrend = { direction: "up" as const, percentage: 10, message: "", delta: 200 };
      const proTrend = { direction: "up" as const, percentage: 15, message: "", delta: 20 };
      const carbsTrend = { direction: "stable" as const, percentage: 0, message: "", delta: 0 };
      const fatsTrend = { direction: "stable" as const, percentage: 0, message: "", delta: 0 };

      const summary = generateOverallTrendSummary(calTrend, proTrend, carbsTrend, fatsTrend);
      expect(summary).toContain("Calories are trending upward");
      expect(summary).toContain("protein +20g/day");
    });
  });

  describe("calculateDataQuality", () => {
    it("calculates current streak = 1 when only today is tracked out of 7 days", () => {
      const data = [
        { name: "D1", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D2", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D3", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D4", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D5", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D6", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D7", calories: 2000, protein: 100, carbs: 200, fats: 60 },
      ];

      const result = calculateDataQuality(data, 7);
      expect(result.daysLogged).toBe(1);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
    });

    it("calculates current streak = 1 when only yesterday is tracked (today in progress)", () => {
      const data = [
        { name: "D1", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D2", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D3", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D4", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D5", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D6", calories: 2000, protein: 100, carbs: 200, fats: 60 },
        { name: "D7", calories: 0, protein: 0, carbs: 0, fats: 0 },
      ];

      const result = calculateDataQuality(data, 7);
      expect(result.daysLogged).toBe(1);
      expect(result.currentStreak).toBe(1);
      expect(result.longestStreak).toBe(1);
    });

    it("calculates current streak = 0 when tracked day was 3 days ago", () => {
      const data = [
        { name: "D1", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D2", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D3", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D4", calories: 2000, protein: 100, carbs: 200, fats: 60 },
        { name: "D5", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D6", calories: 0, protein: 0, carbs: 0, fats: 0 },
        { name: "D7", calories: 0, protein: 0, carbs: 0, fats: 0 },
      ];

      const result = calculateDataQuality(data, 7);
      expect(result.daysLogged).toBe(1);
      expect(result.currentStreak).toBe(0);
      expect(result.longestStreak).toBe(1);
    });
  });
});
