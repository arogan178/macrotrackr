import { describe, expect, it } from "vitest";
import {
  getLocalDate,
  getCurrentTimestamp,
  isValidDate,
  isValidTime,
  formatDate,
  formatTime,
  parseDate,
  daysDifference,
  weeksDifference,
} from "../../src/lib/dates";

describe("dates", () => {
  describe("getLocalDate", () => {
    it("returns date in YYYY-MM-DD format", () => {
      const result = getLocalDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("getCurrentTimestamp", () => {
    it("returns ISO timestamp", () => {
      const result = getCurrentTimestamp();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("isValidDate", () => {
    it("returns true for valid date", () => {
      expect(isValidDate("2025-06-15")).toBe(true);
    });

    it("returns false for invalid format", () => {
      expect(isValidDate("06-15-2025")).toBe(false);
    });

    it("returns false for invalid date", () => {
      expect(isValidDate("2025-13-45")).toBe(false);
    });

    it("returns false for empty string", () => {
      expect(isValidDate("")).toBe(false);
    });
  });

  describe("isValidTime", () => {
    it("returns true for valid time in HH:MM format", () => {
      expect(isValidTime("14:30")).toBe(true);
    });

    it("returns true for valid time in HH:MM:SS format", () => {
      expect(isValidTime("14:30:45")).toBe(true);
    });

    it("returns false for invalid time", () => {
      expect(isValidTime("25:00")).toBe(false);
    });

    it("returns false for invalid format", () => {
      expect(isValidTime("2pm")).toBe(false);
    });
  });

  describe("formatDate", () => {
    it("formats date as YYYY-MM-DD", () => {
      const date = new Date("2025-06-15T12:00:00Z");
      expect(formatDate(date)).toBe("2025-06-15");
    });
  });

  describe("formatTime", () => {
    it("formats time as HH:MM:SS", () => {
      const date = new Date("2025-06-15T14:30:45Z");
      expect(formatTime(date)).toMatch(/^\d{2}:\d{2}:\d{2}/);
    });
  });

  describe("parseDate", () => {
    it("parses valid date string", () => {
      const result = parseDate("2025-06-15");
      expect(result.getFullYear()).toBe(2025);
      expect(result.getMonth()).toBe(5); // June is 5 (0-indexed)
      expect(result.getDate()).toBe(15);
    });

    it("throws error for invalid date", () => {
      expect(() => parseDate("invalid")).toThrow("Invalid date format");
    });
  });

  describe("daysDifference", () => {
    it("calculates days between two dates", () => {
      expect(daysDifference("2025-01-01", "2025-01-10")).toBe(9);
    });

    it("returns 0 for same date", () => {
      expect(daysDifference("2025-01-01", "2025-01-01")).toBe(0);
    });

    it("works in reverse order", () => {
      expect(daysDifference("2025-01-10", "2025-01-01")).toBe(9);
    });
  });

  describe("weeksDifference", () => {
    it("calculates weeks between two dates", () => {
      expect(weeksDifference("2025-01-01", "2025-01-14")).toBe(2);
    });

    it("rounds up partial weeks", () => {
      expect(weeksDifference("2025-01-01", "2025-01-08")).toBe(1);
    });

    it("returns 0 for same date", () => {
      expect(weeksDifference("2025-01-01", "2025-01-01")).toBe(0);
    });
  });
});
