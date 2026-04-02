import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "./auth";
import { setAuthToken, setGetToken } from "./core";
import { userApi } from "./user";

function createJsonResponse(body: unknown, init?: ResponseInit) {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("userApi", () => {
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

  it("normalizes snake_case user payloads into the frontend contract", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        id: 9,
        email: "jordan@example.com",
        first_name: "Jordan",
        last_name: "Lee",
        created_at: "2026-04-01T00:00:00.000Z",
        date_of_birth: "1992-09-10",
        height: 182,
        weight: 77,
        gender: "male",
        activity_level: 4,
        isProfileComplete: true,
        subscription: {
          status: "pro",
          hasStripeCustomer: true,
          currentPeriodEnd: "2026-05-01T00:00:00.000Z",
        },
      }),
    );

    await expect(userApi.getUserDetails()).resolves.toEqual({
      id: 9,
      email: "jordan@example.com",
      firstName: "Jordan",
      lastName: "Lee",
      createdAt: "2026-04-01T00:00:00.000Z",
      dateOfBirth: "1992-09-10",
      height: 182,
      weight: 77,
      gender: "male",
      activityLevel: 4,
      isProfileComplete: true,
      subscription: {
        status: "pro",
        hasStripeCustomer: true,
        currentPeriodEnd: "2026-05-01T00:00:00.000Z",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/user/me",
      expect.objectContaining({
        credentials: "include",
        headers: {},
      }),
    );
  });

  it("throws when the user payload is structurally invalid", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        id: "bad-id",
        email: "broken@example.com",
      }),
    );

    await expect(userApi.getUserDetails()).rejects.toMatchObject({
      name: "ApiError",
      code: "INVALID_USER_RESPONSE",
      status: 500,
    });
  });

  it("syncs auth first before fetching user details", async () => {
    const syncSpy = vi
      .spyOn(authApi, "syncUser")
      .mockResolvedValue({ user: { id: 44 }, isNewUser: false });

    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        id: 44,
        email: "synced@example.com",
        firstName: "Synced",
        lastName: "User",
        createdAt: "2026-04-01T00:00:00.000Z",
        isProfileComplete: false,
        subscription: {
          status: "free",
          hasStripeCustomer: false,
          currentPeriodEnd: undefined,
        },
      }),
    );

    await userApi.syncAndGetUserDetails("token-abc");

    expect(syncSpy).toHaveBeenCalledWith("token-abc");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("converts activity-level strings before updating settings", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({ success: true, message: "Settings updated" }),
    );

    await expect(
      userApi.updateSettings({
        firstName: "Ari",
        activityLevel: "medium",
      }),
    ).resolves.toEqual({ success: true, message: "Settings updated" });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/user/settings",
      expect.objectContaining({
        method: "PUT",
        credentials: "include",
        body: JSON.stringify({
          firstName: "Ari",
          activityLevel: 3,
        }),
      }),
    );
  });
});
