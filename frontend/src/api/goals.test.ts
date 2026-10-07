import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { WeightGoalFormValues } from "@/types/goal";

import {
  calculateCalorieTarget,
  calculateWeeklyChange,
  calculateWeeksToGoal,
} from "../utils/nutritionCalculations";

import { apiClient, ApiError } from "./core";
import { goalsApi } from "./goals";

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
        method: "GET",
        credentials: "include",
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
          startingWeight: 90,
          targetWeight: 80,
          weightGoal: "lose",
          startDate: "2026-04-01",
          targetDate: "2026-06-01",
          calorieTarget: calculateCalorieTarget(tdee, 90, 80),
          weeklyChange: calculateWeeklyChange(90, 80),
          calculatedWeeks: calculateWeeksToGoal(90, 80),
          dailyChange: null,
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
          dailyChange: null,
          targetWeight: 84,
          weightGoal: "gain",
          startDate: "2026-04-10",
          targetDate: "2026-05-20",
        }),
      }),
    );
  });

  it("sends null for unset update fields so the backend accepts the body", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ success: true }));

    await goalsApi.updateWeightGoal({
      goals: { startingWeight: 80, targetWeight: 84 },
      tdee: 2200,
    });

    const [, init] = fetchMock.mock.calls[0];
    expect(JSON.parse(init?.body as string)).toMatchObject({
      weightGoal: null,
      startDate: null,
      targetDate: null,
    });
  });

  it("surfaces a 401 as ApiError", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({ code: "UNAUTHORIZED", message: "nope" }, { status: 401 }),
    );

    await expect(goalsApi.getWeightLog()).rejects.toBeInstanceOf(ApiError);
  });

  it("deletes weight log entry when passed primitive string id or object parameter", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(createJsonResponse({ success: true, id: "log-1" })),
    );

    await goalsApi.deleteWeightLogEntry("log-1");
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:3000/api/goals/weight-log/log-1",
      expect.objectContaining({ method: "DELETE" }),
    );

    await goalsApi.deleteWeightLogEntry({ id: "log-1" });
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:3000/api/goals/weight-log/log-1",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
