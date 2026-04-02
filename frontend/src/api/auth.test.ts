import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "./auth";
import { setAuthToken, setGetToken } from "./core";

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("authApi", () => {
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

  it("submits reset-password payload and returns the API response", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({ success: true, message: "Password reset" }),
    );

    await expect(authApi.resetPassword("token-123", "new-password")).resolves.toEqual({
      success: true,
      message: "Password reset",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/reset-password",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token: "token-123", newPassword: "new-password" }),
      }),
    );
  });

  it("uses an explicit bearer token for sync requests when provided", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        user: { id: 1, email: "taylor@example.com" },
        isNewUser: false,
      }),
    );

    await authApi.syncUser("direct-token");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/clerk-sync",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: "Bearer direct-token",
          "Content-Type": "application/json",
        },
      }),
    );
  });

  it("falls back to async auth headers when no explicit token is provided", async () => {
    setGetToken(async () => "fresh-clerk-token");
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        user: { id: 2, email: "casey@example.com" },
        isNewUser: true,
      }),
    );

    await authApi.syncUser();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/clerk-sync",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: "Bearer fresh-clerk-token",
          "Content-Type": "application/json",
        },
      }),
    );
  });
});
