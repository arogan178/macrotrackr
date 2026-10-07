import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "./auth";
import { apiClient } from "./core";

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

  it("sends the explicit sync token instead of the default one", async () => {
    apiClient.setGetToken(async () => "fresh-clerk-token");
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        id: 1,
        clerkId: "user_1",
        email: "taylor@example.com",
        firstName: "Taylor",
        lastName: "Diaz",
        isNewUser: false,
      }),
    );

    await authApi.syncUser({ token: "direct-token" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/clerk-sync",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({ authorization: "Bearer direct-token" }),
      }),
    );
  });

  it("falls back to async auth headers when no explicit token is provided", async () => {
    apiClient.setGetToken(async () => "fresh-clerk-token");
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        id: 2,
        clerkId: "user_2",
        email: "casey@example.com",
        firstName: "Casey",
        lastName: "Ng",
        isNewUser: true,
      }),
    );

    await authApi.syncUser();

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/clerk-sync",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: expect.objectContaining({ authorization: "Bearer fresh-clerk-token" }),
      }),
    );
  });

  it("logs in with the session cookie and no Authorization header", async () => {
    apiClient.setGetToken(async () => "fresh-clerk-token");
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        success: true,
        user: { id: 3, email: "sam@example.com", firstName: "Sam", lastName: "Lo" },
      }),
    );

    await authApi.login({ email: "sam@example.com", password: "secure-password" });

    const [url, init] = fetchMock.mock.calls[0] ?? [];
    expect(url).toBe("http://localhost:3000/api/auth/login");
    expect(init).toMatchObject({
      method: "POST",
      credentials: "include",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "sam@example.com", password: "secure-password" }),
    });
    expect(init?.headers).not.toHaveProperty("authorization");
  });

  it("clears the stored token even when logout is rejected", async () => {
    apiClient.setAuthToken("stale-token");
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        { code: "UNAUTHORIZED", message: "Authentication required. Please sign in." },
        { status: 401, statusText: "Unauthorized" },
      ),
    );

    await expect(authApi.logout()).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      code: "UNAUTHORIZED",
    });
    await expect(apiClient.getAuthToken()).resolves.toBeNull();
  });
});
