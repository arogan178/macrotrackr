import { describe, expect, it } from "vitest";

import {
  createWeightLogEntry,
  filterWeightLogByDateRange,
  sortWeightLogByDate,
} from "./weightLogUtilities";

describe("weightLogUtilities", () => {
  describe("createWeightLogEntry", () => {
    it("creates entry with current date when no date provided", () => {
      const entry = createWeightLogEntry(150);
      expect(entry.weight).toBe(150);
      expect(entry.timestamp).toBeDefined();
    });

    it("creates entry with specified date", () => {
      const entry = createWeightLogEntry(150, "2024-01-15");
      expect(entry.weight).toBe(150);
      expect(entry.timestamp).toContain("2024-01-15");
    });
  });

  describe("sortWeightLogByDate", () => {
    it("sorts entries by date descending", () => {
      const entries = [
        { id: "1", weight: 150, timestamp: "2024-01-01T10:00:00Z" },
        { id: "2", weight: 152, timestamp: "2024-01-03T10:00:00Z" },
        { id: "3", weight: 151, timestamp: "2024-01-02T10:00:00Z" },
      ];
      const sorted = sortWeightLogByDate(entries);
      expect(sorted[0].id).toBe("2");
      expect(sorted[1].id).toBe("3");
      expect(sorted[2].id).toBe("1");
    });

    it("does not mutate original array", () => {
      const entries = [
        { id: "1", weight: 150, timestamp: "2024-01-01T10:00:00Z" },
      ];
      sortWeightLogByDate(entries);
      expect(entries[0].id).toBe("1");
    });

    it("handles empty array", () => {
      const sorted = sortWeightLogByDate([]);
      expect(sorted).toEqual([]);
    });
  });

  describe("filterWeightLogByDateRange", () => {
    const entries = [
      { id: "1", weight: 150, timestamp: "2024-01-01T10:00:00Z" },
      { id: "2", weight: 152, timestamp: "2024-01-05T10:00:00Z" },
      { id: "3", weight: 151, timestamp: "2024-01-10T10:00:00Z" },
    ];

    it("filters entries within date range", () => {
      const filtered = filterWeightLogByDateRange(
        entries,
        "2024-01-01",
        "2024-01-06",
      );
      expect(filtered).toHaveLength(2);
      expect(filtered.map((entry) => entry.id)).toEqual(["1", "2"]);
    });

    it("excludes entries outside date range", () => {
      const filtered = filterWeightLogByDateRange(
        entries,
        "2024-01-02",
        "2024-01-06",
      );
      expect(filtered).toHaveLength(1);
      expect(filtered[0].id).toBe("2");
    });

    it("handles empty array", () => {
      const filtered = filterWeightLogByDateRange([], "2024-01-01", "2024-01-10");
      expect(filtered).toEqual([]);
    });
  });
});
