import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, renderHook, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authApi } from "@/api/auth";
import { ApiError } from "@/api/core";
import { queryKeys } from "@/lib/queryKeys";
import { removeToken } from "@/utils/tokenStorage";

import { useLogout } from "./useAuthQueries.local";

const navigate = vi.hoisted(() => vi.fn());
vi.mock("@tanstack/react-router", () => ({ useNavigate: () => navigate }));
vi.mock("@/api/auth", () => ({ authApi: { logout: vi.fn() } }));
vi.mock("@/services/biometrics", () => ({
  clearBiometricCredentials: vi.fn(),
}));
vi.mock("@/utils/tokenStorage", () => ({ removeToken: vi.fn() }));

function renderLogout() {
  const queryClient = new QueryClient();
  queryClient.setQueryData(queryKeys.auth.user(), { id: 7 });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  const { result } = renderHook(() => useLogout(), { wrapper });

  return { result, queryClient };
}

describe("local useLogout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("signs out when the server no longer knows the session, as after deleting the account", async () => {
    vi.mocked(authApi.logout).mockRejectedValue(
      new ApiError("Unauthorized", 401, "UNAUTHORIZED"),
    );
    const { result, queryClient } = renderLogout();

    act(() => result.current.mutate());

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(removeToken).toHaveBeenCalledTimes(1);
    expect(queryClient.getQueryData(queryKeys.auth.user())).toBeUndefined();
    expect(navigate).toHaveBeenCalledWith({ to: "/" });
  });

  it("keeps the user in place when logout fails for another reason", async () => {
    vi.mocked(authApi.logout).mockRejectedValue(
      new ApiError("Server error", 500, "INTERNAL"),
    );
    const { result, queryClient } = renderLogout();

    act(() => result.current.mutate());

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(queryClient.getQueryData(queryKeys.auth.user())).toEqual({ id: 7 });
    expect(navigate).not.toHaveBeenCalled();
  });
});
