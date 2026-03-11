import { describe, expect, it } from "vitest";
import { getTodayEntries } from "./calculations";

describe("macroTracking calculations", () => {
  describe("getTodayEntries", () => {
    it("filters entries for today", () => {
      const today = new Date().toISOString().split("T")[0];
      const entries = [
        { entryDate: today, protein: 10 },
        { entryDate: "2020-01-01", protein: 20 },
      ] as any;
      
      const result = getTodayEntries(entries);
      expect(result.length).toBe(1);
      expect(result[0].protein).toBe(10);
    });

    it("returns empty array when no entries", () => {
      const result = getTodayEntries([]);
      expect(result).toEqual([]);
    });
  });
});
