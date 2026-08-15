import { describe, expect, it } from "vitest";

import {
  calculateProgress,
  calculateRemainingToTarget,
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
});
