import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient } from "./core";
import { habitsApi } from "./habits";

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("habitsApi", () => {
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

  it("fetches all habits for the local day with include credentials", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse([{ id: "h1", title: "Walk" }]));

    await expect(habitsApi.getHabits("2026-09-25")).resolves.toEqual([
      { id: "h1", title: "Walk" },
    ]);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/habits?date=2026-09-25",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("sends progress changes with the local day", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ id: "habit-1", current: 0 }));

    await habitsApi.updateHabitProgress("habit-1", "decrement", "2026-09-25");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/habits/habit-1/progress",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({ action: "decrement", date: "2026-09-25" }),
      }),
    );
  });
});
