import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "./auth";
import { apiClient } from "./core";
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

  it("maps nullable profile fields onto the frontend contract", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({
        id: 9,
        email: "jordan@example.com",
        firstName: "Jordan",
        lastName: "Lee",
        createdAt: "2026-04-01T00:00:00.000Z",
        dateOfBirth: null,
        height: 182,
        weight: null,
        gender: null,
        activityLevel: null,
        switchingSource: null,
        unitSystem: "imperial",
        analyticsTrafficType: "internal",
        isProfileComplete: false,
        subscription: {
          status: "pro",
        },
      }),
    );

    await expect(userApi.getUserDetails()).resolves.toEqual({
      id: 9,
      email: "jordan@example.com",
      firstName: "Jordan",
      lastName: "Lee",
      createdAt: "2026-04-01T00:00:00.000Z",
      dateOfBirth: "",
      height: 182,
      weight: undefined,
      gender: undefined,
      activityLevel: undefined,
      switchingSource: undefined,
      unitSystem: "imperial",
      analyticsTrafficType: "internal",
      isProfileComplete: false,
      subscription: {
        status: "pro",
      },
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/user/me",
      expect.objectContaining({ method: "GET", credentials: "include" }),
    );
  });

  it("throws when the user payload is not JSON", async () => {
    fetchMock.mockResolvedValueOnce(
      new Response("<!doctype html>", {
        status: 200,
        headers: { "Content-Type": "text/html" },
      }),
    );

    await expect(userApi.getUserDetails()).rejects.toMatchObject({
      name: "ApiError",
      code: "INVALID_USER_RESPONSE",
      status: 500,
    });
  });

  it("surfaces a 401 as ApiError", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse(
        { code: "UNAUTHORIZED", message: "Authentication required" },
        { status: 401, statusText: "Unauthorized" },
      ),
    );

    await expect(userApi.getUserDetails()).rejects.toMatchObject({
      name: "ApiError",
      status: 401,
      code: "UNAUTHORIZED",
      message: "Authentication required",
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
        },
      }),
    );

    await userApi.syncAndGetUserDetails({ token: "token-abc" });

    expect(syncSpy).toHaveBeenCalledWith({ token: "token-abc" });
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

  it("sends the fixed switching source with profile completion", async () => {
    fetchMock.mockResolvedValueOnce(
      createJsonResponse({ success: true, message: "Profile updated" }),
    );

    await userApi.completeProfile({
      dateOfBirth: "1990-01-01",
      switchingSource: "macrofactor",
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3000/api/user/complete-profile",
      expect.objectContaining({
        body: JSON.stringify({
          dateOfBirth: "1990-01-01",
          switchingSource: "macrofactor",
        }),
      }),
    );
  });
});
