import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { apiClient, ApiError } from "./core";
import { reportingApi } from "./reporting";

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

  it("surfaces a 401 as ApiError so the offline queue stops retrying", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        { code: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401, statusText: "Unauthorized" },
      ),
    );

    await expect(reportingApi.getMacroDensitySummary()).rejects.toEqual(
      expect.objectContaining<Partial<ApiError>>({
        name: "ApiError",
        status: 401,
        code: "UNAUTHORIZED",
        message: "Authentication required",
      }),
    );
  });

  it("rethrows network failures unchanged", async () => {
    const networkError = new TypeError("Failed to fetch");
    fetchMock.mockRejectedValueOnce(networkError);

    await expect(reportingApi.getMacroDensitySummary()).rejects.toBe(networkError);
  });
});
