import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  calculateCalorieTarget,
  calculateWeeklyChange,
  calculateWeeksToGoal,
} from "@/features/goals/calculations";
import type { WeightGoalFormValues } from "@/types/goal";

import { goalsApi } from "./goals";
import { apiClient } from "./core";

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("goalsApi", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock as unknown as typeof fetch;
    apiClient.setAuthToken(null);
    apiClient.setGetToken(async () => null);
  });

  afterEach(() => {
    global.fetch = undefined as unknown as typeof fetch;
    vi.restoreAllMocks();
    apiClient.setAuthToken(null);
    apiClient.setGetToken(async () => null);
  });

  it("normalizes null weight-goal responses to undefined", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse(null));

    await expect(goalsApi.getWeightGoals()).resolves.toBeUndefined();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/goals/weight",
      expect.objectContaining({
        credentials: "include",
        headers: {},
      }),
    );
  });

  it("creates weight goals with computed calorie and timeline defaults", async () => {
    const goals: WeightGoalFormValues = {
      startingWeight: 90,
      targetWeight: 80,
      weightGoal: "lose",
      startDate: "2026-04-01",
      targetDate: "2026-06-01",
    };
    const tdee = 2500;

    fetchMock.mockResolvedValueOnce(createJsonResponse({ success: true }));

    await goalsApi.createWeightGoal({ goals, tdee });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/goals/weight",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        body: JSON.stringify({
          ...goals,
          calorieTarget: calculateCalorieTarget(tdee, 90, 80),
          weeklyChange: calculateWeeklyChange(90, 80),
          calculatedWeeks: calculateWeeksToGoal(90, 80),
          dailyChange: undefined,
        }),
      }),
    );
  });

  it("updates a weight goal and includes normalized computed fields", async () => {
    const goals: WeightGoalFormValues = {
      startingWeight: 80,
      targetWeight: 84,
      weightGoal: "gain",
      startDate: "2026-04-10",
      targetDate: "2026-05-20",
    };

    fetchMock.mockResolvedValueOnce(createJsonResponse({ success: true }));

    await goalsApi.updateWeightGoal({ goals, tdee: 2200 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/goals/weight",
      expect.objectContaining({
        method: "PUT",
        body: JSON.stringify({
          calorieTarget: calculateCalorieTarget(2200, 80, 84),
          weeklyChange: calculateWeeklyChange(80, 84),
          calculatedWeeks: calculateWeeksToGoal(80, 84),
          dailyChange: undefined,
          targetWeight: 84,
          weightGoal: "gain",
          startDate: "2026-04-10",
          targetDate: "2026-05-20",
        }),
      }),
    );
  });

  it("returns normalized addWeightLogEntry payloads", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        id: "entry-1",
        timestamp: "2026-04-03T10:00:00.000Z",
        weight: 79.4,
        ignoredField: true,
      }),
    );

    await expect(
      goalsApi.addWeightLogEntry({
        timestamp: "2026-04-03T10:00:00.000Z",
        weight: 79.4,
      }),
    ).resolves.toEqual({
      id: "entry-1",
      timestamp: "2026-04-03T10:00:00.000Z",
      weight: 79.4,
    });
  });
});
