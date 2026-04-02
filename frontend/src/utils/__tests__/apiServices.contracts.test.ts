import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authApi as authApiClient } from "../../api/auth";
import {
  ApiError,
  getAuthToken,
  getHeaders,
  handleResponse,
  setAuthToken,
  setGetToken,
} from "../../api/core";
import { userApi } from "../../api/user";

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
    setAuthToken(null);
    setGetToken(async () => null);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    setAuthToken(null);
    setGetToken(async () => null);
  });

  it("prefers the fresh Clerk token over a stale static token", async () => {
    setAuthToken("stale-token");
    setGetToken(async () => "fresh-token");

    expect(await getAuthToken()).toBe("fresh-token");
    await expect(getHeaders()).resolves.toEqual({
      Authorization: "Bearer fresh-token",
      "Content-Type": "application/json",
    });
  });

  it("falls back to the static token when Clerk cannot provide one", async () => {
    setAuthToken("static-token");

    await expect(getHeaders(false)).resolves.toEqual({
      Authorization: "Bearer static-token",
    });
  });

  it("syncs explicitly before normalizing snake_case user payloads", async () => {
    fetchMock
      .mockResolvedValueOnce(
        createJsonResponse({
          user: {
            id: 11,
            clerkId: "user_123",
            email: "hello@example.com",
            firstName: "Taylor",
            lastName: "Diaz",
          },
          isNewUser: false,
        }),
      )
      .mockResolvedValueOnce(
        createJsonResponse({
          id: 11,
          email: "hello@example.com",
          first_name: "Taylor",
          last_name: "Diaz",
          created_at: "2026-03-09T00:00:00.000Z",
          date_of_birth: "1995-05-20",
          activity_level: 3,
          isProfileComplete: true,
          subscription: {
            status: "pro",
            hasStripeCustomer: true,
            currentPeriodEnd: "2026-04-01T00:00:00.000Z",
          },
        }),
      );

    await expect(userApi.syncAndGetUserDetails()).resolves.toEqual({
      id: 11,
      email: "hello@example.com",
      firstName: "Taylor",
      lastName: "Diaz",
      createdAt: "2026-03-09T00:00:00.000Z",
      dateOfBirth: "1995-05-20",
      height: undefined,
      weight: undefined,
      gender: undefined,
      activityLevel: 3,
      isProfileComplete: true,
      subscription: {
        status: "pro",
        hasStripeCustomer: true,
        currentPeriodEnd: "2026-04-01T00:00:00.000Z",
      },
    });

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "http://localhost:3000/api/auth/clerk-sync",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("keeps auth sync typed to its actual backend contract", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        user: {
          id: 12,
          clerkId: "user_456",
          email: "casey@example.com",
          firstName: "Casey",
          lastName: "Ng",
        },
        isNewUser: true,
      }),
    );

    await expect(authApiClient.syncUser("token-123")).resolves.toEqual({
      user: {
        id: 12,
        clerkId: "user_456",
        email: "casey@example.com",
        firstName: "Casey",
        lastName: "Ng",
      },
      isNewUser: true,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/auth/clerk-sync",
      expect.objectContaining({
        method: "POST",
        credentials: "include",
        headers: {
          Authorization: "Bearer token-123",
          "Content-Type": "application/json",
        },
      }),
    );
  });

  it("surfaces structured API failures through ApiError", async () => {
    await expect(
      handleResponse(
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
