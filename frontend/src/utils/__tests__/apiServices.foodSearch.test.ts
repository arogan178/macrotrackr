import { describe, expect, it } from "vitest";

import {
  type FoodSearchResult,
  normalizeFoodSearchResults,
} from "../../api/macros";

describe("normalizeFoodSearchResults", () => {
  it("returns valid search results unchanged", () => {
    const results: FoodSearchResult[] = [
      {
        name: "Greek Yogurt",
        protein: 17,
        carbs: 6,
        fats: 0,
        energyKcal: 100,
        categories: "Dairy",
        servingQuantity: 170,
        servingUnit: "g",
      },
    ];

    expect(normalizeFoodSearchResults(results)).toEqual(results);
  });

  it("filters out invalid search results", () => {
    const results = [
      {
        name: "Oats",
        protein: 5,
        carbs: 27,
        fats: 3,
        energyKcal: 150,
        categories: "Breakfast cereals",
        servingQuantity: 40,
        servingUnit: "g",
      },
      {
        name: "Broken Item",
        protein: "12",
      },
    ];

    expect(normalizeFoodSearchResults(results)).toEqual([results[0]]);
  });

  it("returns an empty array for non-array payloads", () => {
    expect(normalizeFoodSearchResults(null)).toEqual([]);
    expect(normalizeFoodSearchResults({ data: [] })).toEqual([]);
  });
});