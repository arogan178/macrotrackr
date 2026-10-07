import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  apiClient,
  ApiError,
} from "./core";

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("apiServices contracts", () => {
  const fetchMock = vi.fn<typeof fetch>();

  beforeEach(() => {
    vi.stubGlobal("fetch", fetchMock);
    apiClient.setAuthToken(null);
    apiClient.setGetToken(async () => null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    apiClient.setAuthToken(null);
    apiClient.setGetToken(async () => null);
  });

  it("prefers the fresh Clerk token over a stale static token", async () => {
    apiClient.setAuthToken("stale-token");
    apiClient.setGetToken(async () => "fresh-token");

    expect(await apiClient.getAuthToken()).toBe("fresh-token");
    await expect(apiClient.getHeaders()).resolves.toEqual({
      Authorization: "Bearer fresh-token",
      "Content-Type": "application/json",
    });
  });

  it("falls back to the static token when Clerk cannot provide one", async () => {
    apiClient.setAuthToken("static-token");

    await expect(apiClient.getHeaders(false)).resolves.toEqual({
      Authorization: "Bearer static-token",
    });
  });

  it("surfaces structured API failures through ApiError", async () => {
    await expect(
      apiClient.handleResponse(
        createJsonResponse(
          {
            code: "ACCOUNT_NOT_SYNCED",
            message: "Finish setup first",
            details: { step: "profile" },
          },
          { status: 409, statusText: "Conflict" },
        ),
      ),
    ).rejects.toEqual(
      expect.objectContaining<ApiError>({
        name: "ApiError",
        status: 409,
        code: "ACCOUNT_NOT_SYNCED",
        message: "Finish setup first",
        details: { step: "profile" },
      }),
    );
  });
});
