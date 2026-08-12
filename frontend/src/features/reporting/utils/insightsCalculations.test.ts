import { describe, expect, it } from "vitest";

import {
  calculateConsistencyScore,
  calculateDataQuality,
  calculateMacroBalance,
  calculateMacroDensity,
  calculateTrend,
  generateOverallTrendSummary,
} from "./insightsCalculations";

const day = (calories: number, protein = 0, carbs = 0, fats = 0) => ({
  name: "Day",
  calories,
  protein,
  carbs,
  fats,
});

/** Every user-facing string these helpers emit must be a statement of fact. */
const assertNoCheerleading = (message: string) => {
  expect(message).not.toMatch(/!/);
  expect(message).not.toMatch(
    /excellent|fantastic|great job|great work|keep it up|unlock|journey|optimal|amazing|well done/i,
  );
};

describe("insightsCalculations", () => {
  describe("copy is factual", () => {
    it("states what happened instead of praising the user", () => {
      const averages = { calories: 2000, protein: 100, carbs: 250, fats: 70 };

      assertNoCheerleading(calculateMacroDensity(averages).message);
      assertNoCheerleading(calculateMacroBalance(averages).recommendations);
      assertNoCheerleading(
        calculateDataQuality([day(2000), day(2000)], 2).message,
      );
    });

    it("stays factual when there is no data at all", () => {
      const empty = { calories: 0, protein: 0, carbs: 0, fats: 0 };

      assertNoCheerleading(calculateMacroDensity(empty).message);
      assertNoCheerleading(calculateMacroBalance(empty).recommendations);
      assertNoCheerleading(calculateDataQuality([], 7).message);
    });
  });

  describe("calculateMacroDensity", () => {
    it("reports protein's real share of calories, not an invented score", () => {
      // 100 g protein = 400 kcal of 2000 = 20%.
      const result = calculateMacroDensity({
        calories: 2000,
        protein: 100,
        carbs: 250,
        fats: 70,
      });

      expect(result.score).toBe(20);
      expect(result.message).toContain("20%");
      expect(result.message).toContain("100 g/day");
    });

    it("returns zero without dividing by zero calories", () => {
      expect(
        calculateMacroDensity({ calories: 0, protein: 0, carbs: 0, fats: 0 })
          .score,
      ).toBe(0);
    });
  });

  describe("calculateMacroBalance", () => {
    it("names the gap in points rather than prescribing foods", () => {
      // 200 g protein = 800 kcal, 100 g carbs = 400, 44.4 g fats = 400.
      const result = calculateMacroBalance(
        { calories: 1600, protein: 200, carbs: 100, fats: 44.4 },
        { proteinPercentage: 30, carbsPercentage: 40, fatsPercentage: 30 },
      );

      expect(result.recommendations).toMatch(/Protein is \d+ points above/);
      expect(result.recommendations).toMatch(/Carbs is \d+ points below/);
      expect(result.recommendations).not.toMatch(/avocado|whole grains|foods/i);
    });

    it("confirms a close split without praising it", () => {
      const result = calculateMacroBalance(
        { calories: 2000, protein: 150, carbs: 200, fats: 66.7 },
        { proteinPercentage: 30, carbsPercentage: 40, fatsPercentage: 30 },
      );

      expect(result.recommendations).toMatch(/within \d+ points of your target/);
    });
  });

  describe("calculateDataQuality", () => {
    it("counts logged and missed days instead of grading the user", () => {
      const result = calculateDataQuality([day(2000), day(0), day(2000)], 3);

      expect(result.message).toBe("Logged 2 of 3 days. 1 day missed.");
    });

    it("pluralises missed days", () => {
      const result = calculateDataQuality([day(2000), day(0), day(0)], 3);

      expect(result.message).toBe("Logged 1 of 3 days. 2 days missed.");
    });

    it("reports a clean sweep without an exclamation mark", () => {
      const result = calculateDataQuality([day(2000), day(2000)], 2);

      expect(result.message).toBe(
        "Logged every day in this period (2 of 2).",
      );
    });
  });

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
