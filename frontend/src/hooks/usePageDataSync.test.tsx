import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePageDataSync } from "@/hooks/usePageDataSync";

const useUserMock = vi.fn();
const setSubscriptionStatusMock = vi.fn();

let authMode: "clerk" | "local" = "clerk";

vi.mock("@/config/runtime", () => ({
  get isLocalAuthMode() {
    return authMode === "local";
  },
}));

vi.mock("@/hooks/auth/useAuthQueries", () => ({
  useUser: (...arguments_: unknown[]) => useUserMock(...arguments_),
}));

vi.mock("@/store/store", () => ({
  useStore: (
    selector?: (state: { setSubscriptionStatus: (status: string) => void }) => unknown,
  ) => {
    const state = {
      setSubscriptionStatus: setSubscriptionStatusMock,
    };

    return typeof selector === "function" ? selector(state) : state;
  },
}));

describe("usePageDataSync", () => {
  beforeEach(() => {
    authMode = "clerk";
    useUserMock.mockReset();
    setSubscriptionStatusMock.mockReset();
  });

  it("forces pro status in local auth mode", () => {
    authMode = "local";
    useUserMock.mockReturnValue({ data: undefined });

    renderHook(() => usePageDataSync());

    expect(setSubscriptionStatusMock).toHaveBeenCalledWith("pro");
  });

  it("hydrates subscription from user data in managed mode", () => {
    useUserMock.mockReturnValue({
      data: {
        subscription: {
          status: "canceled",
        },
      },
    });

    renderHook(() => usePageDataSync());

    expect(setSubscriptionStatusMock).toHaveBeenCalledWith("canceled");
  });
});
