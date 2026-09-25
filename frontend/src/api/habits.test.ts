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
      expect.objectContaining({
        credentials: "include",
        headers: {},
      }),
    );
  });

  it("creates and updates habits against resource endpoints", async () => {
    const habit = {
      id: "habit-1",
      title: "Hydrate",
      iconName: "water",
      current: 1,
      target: 8,
      progress: 12.5,
      accentColor: "blue" as const,
      createdAt: "2026-04-04T00:00:00.000Z",
    };

    fetchMock.mockResolvedValueOnce(createJsonResponse(habit));
    fetchMock.mockResolvedValueOnce(createJsonResponse({ ...habit, title: "Hydrate daily" }));

    await habitsApi.saveHabit(habit);
    await habitsApi.updateHabit({ id: "habit-1", data: { ...habit, title: "Hydrate daily" } });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3000/api/habits",
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify(habit),
      }),
    );

    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      "http://localhost:3000/api/habits/habit-1",
      expect.objectContaining({
        method: "PUT",
      }),
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

  it("supports deleting a single habit", async () => {
    fetchMock.mockImplementation(() =>
      Promise.resolve(createJsonResponse({ success: true, id: "habit-2" })),
    );

    await expect(habitsApi.deleteHabit("habit-2")).resolves.toEqual({
      success: true,
      id: "habit-2",
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:3000/api/habits/habit-2",
      expect.objectContaining({ method: "DELETE" }),
    );

    await expect(habitsApi.deleteHabit({ id: "habit-2" })).resolves.toEqual({
      success: true,
      id: "habit-2",
    });
    expect(fetchMock).toHaveBeenLastCalledWith(
      "http://localhost:3000/api/habits/habit-2",
      expect.objectContaining({ method: "DELETE" }),
    );
  });
});
