import { describe, expect, it } from "vitest";

import { buildHistoryCsv } from "./historyExport";

describe("historyExport", () => {
  describe("buildHistoryCsv", () => {
    it("generates CSV with headers", () => {
      const entries = [
        {
          id: "1",
          entryDate: "2024-01-01",
          entryTime: "12:00",
          mealType: "lunch" as const,
          foodName: "Test Entry",
          protein: 10,
          carbs: 20,
          fats: 5,
          ingredients: [],
          createdAt: "2024-01-01T12:00:00Z",
        },
      ];
      const csv = buildHistoryCsv(entries);
      expect(csv).toContain("Entry Date");
      expect(csv).toContain("2024-01-01");
      expect(csv).toContain("lunch");
      expect(csv).toContain("Test Entry");
    });

    it("calculates calories correctly", () => {
      const entries = [
        {
          id: "1",
          entryDate: "2024-01-01",
          entryTime: "12:00",
          mealType: "lunch" as const,
          foodName: "Test",
          protein: 10,
          carbs: 10,
          fats: 10,
          ingredients: [],
          createdAt: "2024-01-01T12:00:00Z",
        },
      ];
      const csv = buildHistoryCsv(entries);
      expect(csv).toContain("170");
    });

    it("handles empty entries", () => {
      const csv = buildHistoryCsv([]);
      expect(csv).toContain("Entry Date");
    });

    it("includes ingredient names", () => {
      const entries = [
        {
          id: "1",
          entryDate: "2024-01-01",
          entryTime: "12:00",
          mealType: "lunch" as const,
          foodName: "Test",
          protein: 10,
          carbs: 10,
          fats: 10,
          ingredients: [
            {
              id: "1",
              name: "Chicken",
              quantity: 100,
              unit: "g",
              protein: 20,
              carbs: 0,
              fats: 5,
            },
          ],
          createdAt: "2024-01-01T12:00:00Z",
        },
      ];
      const csv = buildHistoryCsv(entries);
      expect(csv).toContain("Chicken");
    });
  });
});
