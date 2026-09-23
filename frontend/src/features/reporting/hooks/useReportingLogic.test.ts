import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { MacroEntry } from "@/types/macro";

import { addDaysISO, todayISO } from "../../../utils/dateUtilities";

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
    const today = todayISO();
    const yesterday = addDaysISO(today, -1);

    const mockHistory: MacroEntry[] = [
      {
        id: 1,
        protein: 150, // 600 kcal
        carbs: 200,   // 800 kcal
        fats: 66.7,   // 600 kcal -> total 2000 kcal
        mealType: "lunch",
        entryDate: yesterday,
        createdAt: `${yesterday}T12:00:00Z`,
      },
      {
        id: 2,
        protein: 150,
        carbs: 200,
        fats: 66.7,
        mealType: "dinner",
        entryDate: today,
        createdAt: `${today}T18:00:00Z`,
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

  it("exports one dated row per day, not averaged periods", async () => {
    const today = todayISO();
    const mockHistory: MacroEntry[] = [
      {
        id: 1,
        protein: 100.1,
        carbs: 50.2,
        fats: 20,
        mealType: "lunch",
        entryDate: today,
        createdAt: `${today}T12:00:00Z`,
      },
      {
        id: 2,
        protein: 10.2,
        carbs: 0,
        fats: 0,
        mealType: "dinner",
        entryDate: today,
        createdAt: `${today}T18:00:00Z`,
      },
    ];
    let exported: Blob | undefined;
    const createObjectURL = vi
      .spyOn(URL, "createObjectURL")
      .mockImplementation((blob) => {
        exported = blob as Blob;

        return "blob:test";
      });
    const revokeObjectURL = vi
      .spyOn(URL, "revokeObjectURL")
      .mockImplementation(() => {});
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});

    const { result } = renderHook(() =>
      useReportingLogic(mockHistory, "month", false),
    );
    result.current.handleDownloadCSV();

    // jsdom's Blob has no text(), so read it the old way.
    const csv = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.addEventListener("load", () => resolve(String(reader.result)));
      reader.readAsText(exported!);
    });
    const lines = csv.split("\n");
    expect(lines[0]).toBe("Date,Calories (kcal),Protein (g),Carbs (g),Fats (g)");
    expect(lines).toHaveLength(31);
    expect(lines[1]).toBe(`${addDaysISO(today, -29)},0,0,0,0`);
    expect(lines[30]).toBe(`${today},822,110.3,50.2,20`);

    createObjectURL.mockRestore();
    revokeObjectURL.mockRestore();
    click.mockRestore();
  });
});
