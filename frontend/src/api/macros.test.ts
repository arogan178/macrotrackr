import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  macrosApi,
  normalizeFoodSearchResults,
} from "./macros";
import { apiClient } from "./core";

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("macrosApi", () => {
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

  it("filters invalid food search rows when normalizing", () => {
    const normalized = normalizeFoodSearchResults([
      {
        name: "Greek Yogurt",
        protein: 10,
        carbs: 5,
        fats: 0,
        energyKcal: 80,
        categories: "dairy",
        servingQuantity: 170,
        servingUnit: "g",
      },
      { bad: true },
    ]);

    expect(normalized).toHaveLength(1);
    expect(normalized[0]?.name).toBe("Greek Yogurt");
  });

  it("returns no results for short search terms without making a request", async () => {
    await expect(macrosApi.search({ query: "a" })).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("builds totals URLs with optional date filters", async () => {
    fetchMock.mockResolvedValueOnce(createJsonResponse({ protein: 100 }));

    await macrosApi.getDailyTotals({
      startDate: "2026-04-01",
      endDate: "2026-04-07",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/macros/totals?startDate=2026-04-01&endDate=2026-04-07",
      expect.objectContaining({ credentials: "include" }),
    );
  });

  it("paginates through macro history until hasMore is false", async () => {
    const historySpy = vi.spyOn(macrosApi, "getHistory");
    historySpy
      .mockResolvedValueOnce({
        entries: [{ id: 1 }],
        total: 2,
        limit: 100,
        offset: 0,
        hasMore: true,
        limits: { restricted: false },
      } as never)
      .mockResolvedValueOnce({
        entries: [{ id: 2 }],
        total: 2,
        limit: 100,
        offset: 100,
        hasMore: false,
      } as never);

    const result = await macrosApi.getAllHistory({ startDate: "2026-04-01" });

    expect(historySpy).toHaveBeenNthCalledWith(1, {
      limit: 100,
      offset: 0,
      startDate: "2026-04-01",
    });
    expect(historySpy).toHaveBeenNthCalledWith(2, {
      limit: 100,
      offset: 100,
      startDate: "2026-04-01",
    });
    expect(result).toEqual({
      entries: [{ id: 1 }, { id: 2 }],
      limits: { restricted: false },
    });
  });

  it("rejects saveMacroTargetPercentages when payload is malformed", async () => {
    await expect(
      macrosApi.saveMacroTargetPercentages({ macroTarget: undefined }),
    ).rejects.toThrow("Invalid payload: macroTarget object is required.");
  });
});
