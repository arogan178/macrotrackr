import { onlineManager, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { queryKeys } from "@/lib/queryKeys";

import { useAppAuthState } from "./useAuthState.local";

vi.mock("@/api/auth", () => ({
  authApi: { getSession: vi.fn(() => Promise.reject(new TypeError("Failed to fetch"))) },
}));

describe("useAppAuthState in self-hosted mode", () => {
  afterEach(() => {
    onlineManager.setOnline(true);
  });

  it("opens the app offline from the session saved on this device", () => {
    onlineManager.setOnline(false);
    const queryClient = new QueryClient();
    queryClient.setQueryData(queryKeys.auth.session(), { authenticated: true });

    const { result } = renderHook(() => useAppAuthState(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
      ),
    });

    expect(result.current).toEqual({ isLoaded: true, isSignedIn: true });
  });
});
