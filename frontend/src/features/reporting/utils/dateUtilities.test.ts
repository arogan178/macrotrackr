import { describe, expect, it } from "vitest";

import {
  getDayString,
  getMonthString,
  getReportingPeriod,
  getTodayDate,
  getWeekString,
  mapDateRangeToNumeric,
} from "./dateUtilities";

describe("dateUtilities", () => {
  describe("getTodayDate", () => {
    it("returns ISO date string", () => {
      const result = getTodayDate();
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  describe("getDayString", () => {
    it("formats date correctly", () => {
      const date = new Date("2024-06-15");
      expect(getDayString(date)).toBe("2024-06-15");
    });

    it("pads month and day with zero", () => {
      const date = new Date("2024-01-05");
      expect(getDayString(date)).toBe("2024-01-05");
    });
  });

  describe("getWeekString", () => {
    it("returns week string in correct format", () => {
      const date = new Date("2024-06-15");
      const result = getWeekString(date);
      expect(result).toMatch(/^\d{4}-W\d{2}$/);
    });
  });

  describe("getMonthString", () => {
    it("formats month correctly", () => {
      const date = new Date("2024-06-15");
      expect(getMonthString(date)).toBe("2024-06");
    });

    it("pads month with zero", () => {
      const date = new Date("2024-01-15");
      expect(getMonthString(date)).toBe("2024-01");
    });
  });

  describe("getReportingPeriod", () => {
    it("returns matching period", () => {
      const result = getReportingPeriod("7d");
      expect(result.value).toBe("7d");
    });

    it("returns default for unknown value", () => {
      const result = getReportingPeriod("unknown");
      expect(result.value).toBeDefined();
    });
  });

  describe("mapDateRangeToNumeric", () => {
    it("maps 7d to 7", () => {
      expect(mapDateRangeToNumeric("7d")).toBe(7);
    });

    it("maps 30d to 30", () => {
      expect(mapDateRangeToNumeric("30d")).toBe(30);
    });

    it("maps 90d to 90", () => {
      expect(mapDateRangeToNumeric("90d")).toBe(90);
    });
  });
});
