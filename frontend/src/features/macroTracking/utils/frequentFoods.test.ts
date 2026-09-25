import { describe, expect, it } from "vitest";

import type { MacroEntry } from "@/types/macro";

import { rankFrequentFoods } from "./frequentFoods";

let nextId = 1;
const entry = (mealName: string, protein = 10): MacroEntry => ({
  id: nextId++,
  mealName,
  protein,
  carbs: 20,
  fats: 5,
  mealType: "lunch",
  entryDate: "2026-09-20",
  entryTime: "12:00",
  createdAt: "2026-09-20T12:00:00Z",
});

const names = (entries: MacroEntry[], limit = 10) =>
  rankFrequentFoods(entries, limit).map(({ entry: food, count }) => [
    food.mealName,
    count,
  ]);

describe("rankFrequentFoods", () => {
  it("orders foods by how often they were logged", () => {
    const history = [
      entry("Apple"),
      entry("Oats"),
      entry("Oats"),
      entry("Chicken"),
      entry("Oats"),
      entry("Chicken"),
    ];

    expect(names(history)).toEqual([
      ["Oats", 3],
      ["Chicken", 2],
      ["Apple", 1],
    ]);
  });

  it("breaks ties by the most recently logged food", () => {
    const history = [
      entry("Banana"),
      entry("Toast"),
      entry("Yoghurt"),
      entry("Toast"),
      entry("Banana"),
      entry("Yoghurt"),
    ];

    expect(names(history)).toEqual([
      ["Banana", 2],
      ["Toast", 2],
      ["Yoghurt", 2],
    ]);
  });

  it("counts names case- and whitespace-insensitively and keeps the latest entry", () => {
    const latest = entry("Oats ", 12);
    const ranked = rankFrequentFoods([latest, entry("oats", 8)], 10);

    expect(ranked).toEqual([{ entry: latest, count: 2 }]);
  });

  it("prefers the food name over the meal name and skips unnamed entries", () => {
    const history = [
      { ...entry("Lunch"), foodName: "Rice" },
      entry("Rice"),
      entry("  "),
    ];

    expect(
      rankFrequentFoods(history, 10).map(({ count }) => count),
    ).toEqual([2]);
  });

  it("returns at most the requested number of foods", () => {
    const history = Array.from({ length: 15 }, (_, index) =>
      entry(`Food ${index}`),
    );

    expect(rankFrequentFoods(history, 10)).toHaveLength(10);
  });
});
