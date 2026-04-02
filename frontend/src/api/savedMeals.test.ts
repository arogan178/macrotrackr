import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { savedMealsApi } from "./savedMeals";
import { setAuthToken, setGetToken } from "./core";

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("savedMealsApi", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
    setAuthToken(null);
    setGetToken(async () => null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    setAuthToken(null);
    setGetToken(async () => null);
  });

  it("fetches saved meals without forcing a JSON content-type header", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({ meals: [], count: 0, limit: 10, isPro: false }),
    );

    await expect(savedMealsApi.getAll()).resolves.toEqual({
      meals: [],
      count: 0,
      limit: 10,
      isPro: false,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/saved-meals",
      expect.objectContaining({
        credentials: "include",
        headers: {},
      }),
    );
  });

  it("creates a saved meal with serialized payload", async () => {
    const payload = {
      name: "Chicken Bowl",
      protein: 40,
      carbs: 55,
      fats: 12,
      mealType: "lunch" as const,
      ingredients: [{ item: "Chicken" }],
    };

    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        id: 101,
        createdAt: "2026-04-01T00:00:00.000Z",
        ...payload,
        calories: 488,
      }),
    );

    await savedMealsApi.create(payload);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/saved-meals",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }),
    );
  });

  it("deletes a saved meal by id", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ success: true, id: 77 }));

    await expect(savedMealsApi.delete(77)).resolves.toEqual({ success: true, id: 77 });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/saved-meals/77",
      expect.objectContaining({
        method: "DELETE",
        credentials: "include",
        headers: {},
      }),
    );
  });
});
