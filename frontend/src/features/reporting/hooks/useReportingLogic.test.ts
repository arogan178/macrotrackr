import { renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { MacroEntry } from "@/types/macro";

import { useReportingLogic } from "./useReportingLogic";

describe("useReportingLogic", () => {
  it("handles empty history gracefully", () => {
    const { result } = renderHook(() =>
      useReportingLogic([], "week", false),
    );

    expect(result.current.averages).toEqual({
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
    });
    expect(result.current.trackedDays).toBe(0);
    expect(result.current.totalDays).toBe(0);
  });

  it("calculates averages over tracked days when partially logged in week view", () => {
    // Suppose user logged food on only 2 of 7 days: 2000 kcal on day 1, 2000 kcal on day 2
    const mockHistory: MacroEntry[] = [
      {
        id: 1,
        protein: 150, // 600 kcal
        carbs: 200,   // 800 kcal
        fats: 66.7,   // 600 kcal -> total 2000 kcal
        mealType: "lunch",
        entryDate: "2026-07-27",
        createdAt: "2026-07-27T12:00:00Z",
      },
      {
        id: 2,
        protein: 150,
        carbs: 200,
        fats: 66.7,
        mealType: "dinner",
        entryDate: "2026-07-28",
        createdAt: "2026-07-28T18:00:00Z",
      },
    ];

    const { result } = renderHook(() =>
      useReportingLogic(mockHistory, "week", false),
    );

    // Tracked days should be 2
    expect(result.current.trackedDays).toBe(2);
    expect(result.current.totalDays).toBe(7);

    // Average calories should be 4000 total / 2 tracked days = 2000 kcal/day (not 4000/7 = 571)
    expect(result.current.averages.calories).toBe(2000);
    expect(result.current.averages.protein).toBe(150);
  });
});
