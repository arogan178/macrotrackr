import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { MacroEntry, useMealTimeBreakdown } from "./useMealTimeBreakdown";

describe("useMealTimeBreakdown", () => {
  it("returns empty array when history is empty", () => {
    const { result } = renderHook(() =>
      useMealTimeBreakdown([], "2026-07-20", "2026-07-27", "calories"),
    );

    expect(result.current).toEqual([]);
  });

  it("calculates percentage share and daily average per meal type correctly", () => {
    const mockHistory: MacroEntry[] = [
      // Day 1: Lunch 500 kcal, Dinner 1000 kcal
      {
        id: 1,
        protein: 50,
        carbs: 50,
        fats: 11.11, // ~500 kcal
        mealType: "lunch",
        entryDate: "2026-07-27",
        createdAt: "2026-07-27T12:00:00Z",
      },
      {
        id: 2,
        protein: 100,
        carbs: 100,
        fats: 22.22, // ~1000 kcal
        mealType: "dinner",
        entryDate: "2026-07-27",
        createdAt: "2026-07-27T18:00:00Z",
      },
    ];

    const { result } = renderHook(() =>
      useMealTimeBreakdown(mockHistory, "2026-07-27", "2026-07-27", "calories"),
    );

    expect(result.current.length).toBe(4); // breakfast, lunch, dinner, snack

    const lunch = result.current.find((item) => item.name === "Lunch");
    const dinner = result.current.find((item) => item.name === "Dinner");

    expect(lunch).toBeDefined();
    expect(dinner).toBeDefined();

    // Lunch is 500 kcal out of 1500 total = 33%
    expect(lunch?.percentage).toBe(33);
    // Dinner is 1000 kcal out of 1500 total = 67%
    expect(dinner?.percentage).toBe(67);

    // Daily averages over 1 tracked day
    expect(lunch?.value).toBe(500);
    expect(dinner?.value).toBe(1000);
  });
});
