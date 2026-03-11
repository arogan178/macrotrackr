import { describe, expect, it } from "vitest";

import {
  calculateCompletionRate,
  calculateProgress,
  calculateRemainingToTarget,
  calculateStreakDays,
  getHabitProgressColor,
  getProgressBarColor,
  isHabitComplete,
} from "./calculations";

describe("goals/utils/habits/calculations", () => {
  describe("calculateProgress", () => {
    it("calculates progress percentage correctly", () => {
      expect(calculateProgress(50, 100)).toBe(50);
      expect(calculateProgress(25, 100)).toBe(25);
      expect(calculateProgress(75, 100)).toBe(75);
    });

    it("caps progress at 100", () => {
      expect(calculateProgress(150, 100)).toBe(100);
      expect(calculateProgress(100, 100)).toBe(100);
    });

    it("returns 0 for zero target", () => {
      expect(calculateProgress(50, 0)).toBe(0);
    });

    it("returns 0 for negative target", () => {
      expect(calculateProgress(50, -10)).toBe(0);
    });

    it("rounds to nearest integer", () => {
      expect(calculateProgress(33, 100)).toBe(33);
      expect(calculateProgress(33.7, 100)).toBe(34);
    });
  });

  describe("isHabitComplete", () => {
    it("returns true when current meets or exceeds target", () => {
      expect(isHabitComplete(100, 100)).toBe(true);
      expect(isHabitComplete(101, 100)).toBe(true);
    });

    it("returns false when current is below target", () => {
      expect(isHabitComplete(99, 100)).toBe(false);
      expect(isHabitComplete(0, 100)).toBe(false);
    });
  });

  describe("calculateRemainingToTarget", () => {
    it("calculates remaining amount correctly", () => {
      expect(calculateRemainingToTarget(50, 100)).toBe(50);
      expect(calculateRemainingToTarget(0, 100)).toBe(100);
    });

    it("returns 0 when current exceeds target", () => {
      expect(calculateRemainingToTarget(150, 100)).toBe(0);
      expect(calculateRemainingToTarget(100, 100)).toBe(0);
    });
  });

  describe("calculateCompletionRate", () => {
    it("calculates completion rate correctly", () => {
      const habits = [
        { current: 100, target: 100 },
        { current: 50, target: 100 },
        { current: 100, target: 100 },
      ];
      expect(calculateCompletionRate(habits)).toBe(67); // 2/3 = 66.67 rounded
    });

    it("returns 0 for empty array", () => {
      expect(calculateCompletionRate([])).toBe(0);
    });

    it("returns 100 when all habits are complete", () => {
      const habits = [
        { current: 100, target: 100 },
        { current: 50, target: 50 },
      ];
      expect(calculateCompletionRate(habits)).toBe(100);
    });
  });

  describe("calculateStreakDays", () => {
    it("calculates consecutive streak days", () => {
      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86_400_000).toISOString().split("T")[0];
      const twoDaysAgo = new Date(Date.now() - 172_800_000).toISOString().split("T")[0];

      expect(calculateStreakDays([today, yesterday, twoDaysAgo])).toBe(3);
    });

    it("returns 0 for empty array", () => {
      expect(calculateStreakDays([])).toBe(0);
    });

    it("breaks streak on gap", () => {
      const today = new Date().toISOString().split("T")[0];
      const threeDaysAgo = new Date(Date.now() - 259_200_000).toISOString().split("T")[0];

      expect(calculateStreakDays([today, threeDaysAgo])).toBe(1);
    });
  });

  describe("getHabitProgressColor", () => {
    it("returns success color for 100% progress", () => {
      expect(getHabitProgressColor(100)).toBe("text-success");
    });

    it("returns primary color for 75-99% progress", () => {
      expect(getHabitProgressColor(75)).toBe("text-primary");
      expect(getHabitProgressColor(99)).toBe("text-primary");
    });

    it("returns warning color for 50-74% progress", () => {
      expect(getHabitProgressColor(50)).toBe("text-warning");
      expect(getHabitProgressColor(74)).toBe("text-warning");
    });

    it("returns foreground color for below 50%", () => {
      expect(getHabitProgressColor(49)).toBe("text-foreground");
      expect(getHabitProgressColor(0)).toBe("text-foreground");
    });
  });

  describe("getProgressBarColor", () => {
    it("returns green for 100% progress", () => {
      expect(getProgressBarColor(100)).toBe("green");
    });

    it("returns blue for 75-99% progress", () => {
      expect(getProgressBarColor(75)).toBe("blue");
      expect(getProgressBarColor(99)).toBe("blue");
    });

    it("returns yellow for 50-74% progress", () => {
      expect(getProgressBarColor(50)).toBe("yellow");
      expect(getProgressBarColor(74)).toBe("yellow");
    });

    it("returns gray for below 50%", () => {
      expect(getProgressBarColor(49)).toBe("gray");
      expect(getProgressBarColor(0)).toBe("gray");
    });
  });
});
