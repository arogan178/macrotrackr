import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { reportingApi } from "./reporting";
import { apiClient } from "./core";

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("reportingApi", () => {
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

  it("requests nutrient density summaries with optional query parameters", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse([
        {
          period: "2026-04-01",
          calories: 2200,
          protein: 150,
          carbs: 200,
          fats: 70,
          count: 4,
        },
      ]),
    );

    await expect(
      reportingApi.getMacroDensitySummary({
        startDate: "2026-04-01",
        endDate: "2026-04-07",
        groupBy: "day",
      }),
    ).resolves.toHaveLength(1);

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/reporting/nutrient-density-summary?startDate=2026-04-01&endDate=2026-04-07&groupBy=day",
      expect.objectContaining({
        credentials: "include",
        headers: {},
      }),
    );
  });
});
