import type { ExpenditureResult } from "@shared/expenditure";
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WeightGoals } from "@/types/goal";

import { useTargetSuggestion } from "./useTargetSuggestion";

const updateGoal = vi.hoisted(() => vi.fn());
const today = vi.hoisted(() => ({ value: "2026-10-12" }));
vi.mock("@/hooks/queries/useGoals", () => ({
  useUpdateWeightGoal: () => ({ mutateAsync: updateGoal, isPending: false }),
}));
vi.mock("@/store/store", () => ({
  useStore: () => ({ showNotification: vi.fn() }),
}));
vi.mock("@/utils/dateUtilities", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  todayISO: () => today.value,
}));

const measured: ExpenditureResult = {
  status: "measured",
  estimate: 2347,
  avgIntake: 2000,
  usableDays: 18,
  windowDays: 21,
  trendStartKg: 81,
  trendEndKg: 80,
  spanDays: 20,
  dailyBalance: -347,
};

const goals: WeightGoals = {
  startingWeight: 85,
  currentWeight: 80,
  targetWeight: 75,
  weightGoal: "lose",
  startDate: "2026-09-01",
  targetDate: "2027-01-01",
  calorieTarget: 2240,
  calculatedWeeks: 13,
  weeklyChange: -0.4,
  dailyChange: -440,
};

const args = { expenditure: measured, goals, bmr: 1700, tdee: 2600, userId: 7 };

describe("useTargetSuggestion", () => {
  beforeEach(() => {
    today.value = "2026-10-12";
    updateGoal.mockReset();
  });
  afterEach(() => localStorage.clear());

  it("suggests nothing until expenditure is measured", () => {
    const { result } = renderHook(() =>
      useTargetSuggestion({
        ...args,
        expenditure: { status: "insufficient", usableDays: 4, weighInsInWindow: 1, needs: { loggedDays: 10, weighIns: 2 } },
      }),
    );

    expect(result.current.suggestion).toBeNull();
  });

  it("hides for the rest of the ISO week once dismissed, and returns the next week", () => {
    const { result, rerender } = renderHook(() => useTargetSuggestion(args));
    expect(result.current.suggestion?.target).toBe(1910);

    act(() => result.current.dismiss());
    expect(result.current.suggestion).toBeNull();
    expect(localStorage.getItem("macrotrackr:target-suggestion-dismissed:7:2026-W42")).toBe("1");

    today.value = "2026-10-18";
    rerender();
    expect(result.current.suggestion).toBeNull();

    today.value = "2026-10-19";
    rerender();
    expect(result.current.suggestion?.target).toBe(1910);
  });

  it("keeps one account's dismissal away from another", () => {
    const first = renderHook(() => useTargetSuggestion(args));
    act(() => first.result.current.dismiss());

    const second = renderHook(() => useTargetSuggestion({ ...args, userId: 8 }));
    expect(second.result.current.suggestion?.target).toBe(1910);
  });

  it("accepting changes only the calorie target", async () => {
    updateGoal.mockResolvedValue({});
    const { result } = renderHook(() => useTargetSuggestion(args));

    await act(() => result.current.accept());

    expect(updateGoal).toHaveBeenCalledWith({
      goals: {
        targetWeight: 75,
        weightGoal: "lose",
        startDate: "2026-09-01",
        targetDate: "2027-01-01",
        weeklyChange: -0.4,
        calculatedWeeks: 13,
        dailyChange: -440,
        calorieTarget: 1910,
      },
      tdee: 2600,
    });
  });
});
