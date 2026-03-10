import { describe, expect, it } from "vitest";

import { filterEntriesByDateRange } from "./dataProcessing";

describe("dataProcessing", () => {
  describe("filterEntriesByDateRange", () => {
    it("filters entries within date range", () => {
      const entries = [
        { id: "1", entryDate: "2024-01-01" },
        { id: "2", entryDate: "2024-01-15" },
        { id: "3", entryDate: "2024-02-01" },
      ] as any[];
      const filtered = filterEntriesByDateRange(entries, "2024-01-01", "2024-01-31");
      expect(filtered).toHaveLength(2);
    });

    it("returns empty array for no matches", () => {
      const entries = [
        { id: "1", entryDate: "2024-01-01" },
      ] as any[];
      const filtered = filterEntriesByDateRange(entries, "2024-02-01", "2024-02-28");
      expect(filtered).toHaveLength(0);
    });

    it("returns empty array for empty input", () => {
      const filtered = filterEntriesByDateRange([], "2024-01-01", "2024-01-31");
      expect(filtered).toHaveLength(0);
    });
  });
});
