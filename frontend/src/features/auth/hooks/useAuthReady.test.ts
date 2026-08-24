import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { ApiError } from "@/api/core";
import { useAuthReady } from "@/features/auth/hooks/useAuthReady";

const navigate = vi.fn();
const setQueryData = vi.fn();
const invalidateQueries = vi.fn();
const signOut = vi.fn();
const syncUser = vi.fn();
const getUserDetails = vi.fn();

vi.mock("@clerk/react", () => ({
  useAuth: () => ({ isLoaded: true, isSignedIn: true }),
  useClerk: () => ({ signOut }),
}));

vi.mock("@tanstack/react-query", () => ({
  useQueryClient: () => ({ setQueryData, invalidateQueries }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigate,
}));

vi.mock("@/api/auth", () => ({
  authApi: { syncUser: (...arguments_: unknown[]) => syncUser(...arguments_) },
}));

vi.mock("@/api/user", () => ({
  userApi: {
    getUserDetails: (...arguments_: unknown[]) => getUserDetails(...arguments_),
  },
}));

const COMPLETE_PROFILE = { id: 7, dateOfBirth: "1990-01-01" };

function notSyncedError() {
  return new ApiError("Account not synced", 409, "ACCOUNT_NOT_SYNCED");
}

describe("useAuthReady", () => {
  beforeEach(() => {
    for (const mock of [
      navigate,
      setQueryData,
      invalidateQueries,
      signOut,
      syncUser,
      getUserDetails,
    ]) {
      mock.mockReset();
    }
  });

  it("costs a returning sign-in one request and no sync", async () => {
    getUserDetails.mockResolvedValue(COMPLETE_PROFILE);

    const { result } = renderHook(() => useAuthReady("/home"));
    await result.current.setupAuth();

    expect(getUserDetails).toHaveBeenCalledTimes(1);
    expect(syncUser).not.toHaveBeenCalled();
    expect(setQueryData).toHaveBeenCalledWith(expect.anything(), COMPLETE_PROFILE);
    expect(navigate).toHaveBeenCalledWith({
      to: "/home",
      search: { limit: 20, offset: 0 },
    });
  });

  it("syncs only when there is no local account yet", async () => {
    getUserDetails.mockRejectedValue(notSyncedError());
    syncUser.mockResolvedValue({ isNewUser: true });

    const { result } = renderHook(() => useAuthReady("/home"));
    await result.current.setupAuth();

    expect(syncUser).toHaveBeenCalledTimes(1);
    // A row the sync just inserted is empty by construction; reading it back
    // would only confirm what the response already said.
    expect(getUserDetails).toHaveBeenCalledTimes(1);
    expect(navigate).toHaveBeenCalledWith({
      to: "/profile-setup",
      search: { redirectTo: "/home" },
    });
  });

  it("reads the profile back when the sync linked an existing row", async () => {
    getUserDetails.mockRejectedValueOnce(notSyncedError());
    getUserDetails.mockResolvedValueOnce(COMPLETE_PROFILE);
    syncUser.mockResolvedValue({ isNewUser: false });

    const { result } = renderHook(() => useAuthReady("/home"));
    await result.current.setupAuth();

    expect(getUserDetails).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledWith({
      to: "/home",
      search: { limit: 20, offset: 0 },
    });
  });

  it("retries once when the token has not landed yet", async () => {
    getUserDetails.mockRejectedValueOnce(
      new ApiError("Unauthorized", 401, "HTTP_401"),
    );
    getUserDetails.mockResolvedValueOnce(COMPLETE_PROFILE);

    const { result } = renderHook(() => useAuthReady("/home"));
    await result.current.setupAuth();

    expect(getUserDetails).toHaveBeenCalledTimes(2);
    expect(navigate).toHaveBeenCalledWith({
      to: "/home",
      search: { limit: 20, offset: 0 },
    });
  });

  it("hands a colliding account to the linking flow", async () => {
    getUserDetails.mockRejectedValue(notSyncedError());
    syncUser.mockRejectedValue(
      new ApiError("Already exists", 409, "ACCOUNT_LINK_REQUIRED"),
    );

    const { result } = renderHook(() => useAuthReady("/home"));
    await result.current.setupAuth();

    expect(signOut).toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith({
      to: "/login",
      search: { returnTo: "/settings?tab=accounts" },
      replace: true,
    });
  });

  it("sends an incomplete profile to setup", async () => {
    getUserDetails.mockResolvedValue({ id: 7, dateOfBirth: null });

    const { result } = renderHook(() => useAuthReady("/home"));
    await result.current.setupAuth();

    expect(navigate).toHaveBeenCalledWith({
      to: "/profile-setup",
      search: { redirectTo: "/home" },
    });
  });

  it("skips the network entirely when heading to profile setup", async () => {
    const { result } = renderHook(() => useAuthReady("/profile-setup"));
    await result.current.setupAuth();

    expect(getUserDetails).not.toHaveBeenCalled();
    expect(syncUser).not.toHaveBeenCalled();
    expect(navigate).toHaveBeenCalledWith({
      to: "/profile-setup",
      search: { redirectTo: "/profile-setup" },
      replace: true,
    });
  });
});
