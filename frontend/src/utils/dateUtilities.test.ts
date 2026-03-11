import { describe, expect, it } from "vitest";
import {
  formatISODate,
  todayISO,
  getDisplayDate,
  formatDateShort,
  formatDateFull,
  getDaysInRange,
  getDatesBetween,
  isValidDateString,
  isWithinDateRange,
  addDaysISO,
  eachDayISO,
  mapDateRangeToDays,
  getDateRangeData,
} from "./dateUtilities";

describe("dateUtilities", () => {
  describe("formatISODate", () => {
    it("formats date as YYYY-MM-DD", () => {
      const date = new Date("2025-06-15T12:00:00Z");
      expect(formatISODate(date)).toBe("2025-06-15");
    });

    it("handles default current date", () => {
      const result = formatISODate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("todayISO", () => {
    it("returns today's date in YYYY-MM-DD format", () => {
      const result = todayISO();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("getDisplayDate", () => {
    it("returns formatted display date", () => {
      const date = new Date("2025-06-15");
      const result = getDisplayDate(date);
      expect(result).toContain("2025");
    });
  });

  describe("formatDateShort", () => {
    it("formats YYYY-MM-DD as MMM d", () => {
      expect(formatDateShort("2025-06-15")).toBe("Jun 15");
    });

    it("returns Invalid Date for invalid string", () => {
      expect(formatDateShort("invalid")).toBe("Invalid Date");
    });
  });

  describe("formatDateFull", () => {
    it("formats YYYY-MM-DD as MMMM d, yyyy", () => {
      expect(formatDateFull("2025-06-15")).toBe("June 15, 2025");
    });

    it("returns Invalid Date for invalid string", () => {
      expect(formatDateFull("invalid")).toBe("Invalid Date");
    });
  });

  describe("getDaysInRange", () => {
    it("calculates days between two dates inclusive", () => {
      expect(getDaysInRange("2025-01-01", "2025-01-07")).toBe(7);
    });

    it("returns 0 for invalid dates", () => {
      expect(getDaysInRange("invalid", "2025-01-07")).toBe(0);
    });
  });

  describe("getDatesBetween", () => {
    it("returns array of dates between start and end", () => {
      const dates = getDatesBetween("2025-01-01", "2025-01-03");
      expect(dates).toEqual(["2025-01-01", "2025-01-02", "2025-01-03"]);
    });

    it("returns empty array for invalid dates", () => {
      expect(getDatesBetween("invalid", "2025-01-03")).toEqual([]);
    });
  });

  describe("isValidDateString", () => {
    it("returns true for valid YYYY-MM-DD", () => {
      expect(isValidDateString("2025-06-15")).toBe(true);
    });

    it("returns false for invalid format", () => {
      expect(isValidDateString("06-15-2025")).toBe(false);
    });

    it("returns false for invalid date", () => {
      expect(isValidDateString("2025-13-45")).toBe(false);
    });
  });

  describe("isWithinDateRange", () => {
    it("returns true when target is within range", () => {
      expect(isWithinDateRange("2025-01-05", "2025-01-01", "2025-01-10")).toBe(
        true,
      );
    });

    it("returns false when target is outside range", () => {
      expect(isWithinDateRange("2025-01-15", "2025-01-01", "2025-01-10")).toBe(
        false,
      );
    });
  });

  describe("addDaysISO", () => {
    it("adds days to a YYYY-MM-DD date", () => {
      expect(addDaysISO("2025-01-01", 5)).toBe("2025-01-06");
    });

    it("handles negative days", () => {
      expect(addDaysISO("2025-01-10", -5)).toBe("2025-01-05");
    });
  });

  describe("eachDayISO", () => {
    it("generates array of N days", () => {
      const days = eachDayISO("2025-01-01", 3);
      expect(days).toEqual(["2025-01-01", "2025-01-02", "2025-01-03"]);
    });

    it("returns empty array for invalid input", () => {
      expect(eachDayISO("invalid", 5)).toEqual([]);
    });
  });

  describe("mapDateRangeToDays", () => {
    it("maps week to 7", () => {
      expect(mapDateRangeToDays("week")).toBe(7);
    });

    it("maps month to 30", () => {
      expect(mapDateRangeToDays("month")).toBe(30);
    });

    it("maps 3months to 90", () => {
      expect(mapDateRangeToDays("3months")).toBe(90);
    });

    it("defaults unknown to 7", () => {
      expect(mapDateRangeToDays("unknown")).toBe(7);
    });
  });

  describe("getDateRangeData", () => {
    it("returns correct date range for week", () => {
      const referenceDate = new Date("2025-01-10");
      const result = getDateRangeData("week", referenceDate);
      expect(result.days).toBe(7);
      expect(result.startDate).toBe("2025-01-04");
      expect(result.endDate).toBe("2025-01-10");
    });
  });
});
