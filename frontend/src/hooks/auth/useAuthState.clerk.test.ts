import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppAuthState } from "./useAuthState.clerk";

const state = vi.hoisted(() => ({
  clerk: { isLoaded: false, isSignedIn: false as boolean | undefined, status: "loading" },
  cachedUser: undefined as { id: number } | null | undefined,
  isOffline: false,
  isRestoring: false,
  isOfflineSession: false,
}));

const session = vi.hoisted(() => ({
  start: vi.fn(),
}));

vi.mock("@clerk/react", () => ({
  useAuth: () => ({ isLoaded: state.clerk.isLoaded, isSignedIn: state.clerk.isSignedIn }),
  useClerk: () => ({ status: state.clerk.status }),
}));
vi.mock("@tanstack/react-query", () => ({
  useIsRestoring: () => state.isRestoring,
}));
vi.mock("./useAuthQueries.clerk", () => ({
  useUser: () => ({ data: state.cachedUser }),
}));
vi.mock("@/hooks/useIsOffline", () => ({
  useIsOffline: () => state.isOffline,
}));
vi.mock("@/lib/offlineSession", () => ({
  isOfflineSession: () => state.isOfflineSession,
  startOfflineSession: session.start,
}));

describe("useAppAuthState in Clerk mode", () => {
  beforeEach(() => {
    state.clerk = { isLoaded: false, isSignedIn: undefined, status: "loading" };
    state.cachedUser = { id: 1 };
    state.isOffline = false;
    state.isRestoring = false;
    state.isOfflineSession = false;
    session.start.mockClear();
  });

  it("opens the app for the account cached on this device when launched offline", () => {
    state.isOffline = true;

    expect(renderHook(() => useAppAuthState()).result.current).toEqual({
      isLoaded: true,
      isSignedIn: true,
    });
    expect(session.start).toHaveBeenCalledTimes(1);
  });

  it("stays in that session after the connection comes back, until a reload", () => {
    state.isOfflineSession = true;

    expect(renderHook(() => useAppAuthState()).result.current).toEqual({
      isLoaded: true,
      isSignedIn: true,
    });
  });

  it("does the same when Clerk could not load its script", () => {
    state.clerk.status = "error";

    expect(renderHook(() => useAppAuthState()).result.current).toEqual({
      isLoaded: true,
      isSignedIn: true,
    });
  });

  it("waits for Clerk while it is still loading online", () => {
    expect(renderHook(() => useAppAuthState()).result.current).toEqual({
      isLoaded: false,
      isSignedIn: false,
    });
  });

  it("does not invent a session when nobody was signed in on this device", () => {
    state.isOffline = true;
    state.cachedUser = null;

    expect(renderHook(() => useAppAuthState()).result.current).toEqual({
      isLoaded: false,
      isSignedIn: false,
    });
  });

  it("waits for the saved session to be read back before deciding", () => {
    state.isOffline = true;
    state.isRestoring = true;

    expect(renderHook(() => useAppAuthState()).result.current).toEqual({
      isLoaded: false,
      isSignedIn: false,
    });
  });

  it("follows Clerk once it has loaded", () => {
    state.isOffline = true;
    state.clerk = { isLoaded: true, isSignedIn: false, status: "ready" };

    expect(renderHook(() => useAppAuthState()).result.current).toEqual({
      isLoaded: true,
      isSignedIn: false,
    });
  });
});
