import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const posthog = {
  identify: vi.fn(),
  reset: vi.fn(),
  startSessionRecording: vi.fn(),
  stopSessionRecording: vi.fn(),
};

const userState: { data: { id: string; subscription: { status: string }; createdAt: string; analyticsTrafficType: string; switchingSource?: string } | undefined } =
  { data: undefined };

vi.mock("@posthog/react", () => ({ usePostHog: () => posthog }));
vi.mock("@/hooks/auth/useAuthQueries", () => ({ useUser: () => userState }));

const { default: PostHogUserSync } = await import("./posthogIntegration");

describe("session replay", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    userState.data = undefined;
  });

  it("does not record for a signed-out visitor", () => {
    // Replay costs a ~1,600ms main-thread task. Marketing visitors must not pay it.
    renderHook(() => PostHogUserSync());

    expect(posthog.startSessionRecording).not.toHaveBeenCalled();
  });

  it("records once someone signs in", () => {
    userState.data = {
      id: "user_1",
      subscription: { status: "free" },
      createdAt: "2026-01-01",
      analyticsTrafficType: "organic",
    };
    renderHook(() => PostHogUserSync());

    expect(posthog.startSessionRecording).toHaveBeenCalled();
  });

  it("stops recording before resetting on sign-out", () => {
    userState.data = {
      id: "user_1",
      subscription: { status: "free" },
      createdAt: "2026-01-01",
      analyticsTrafficType: "organic",
    };
    const { rerender } = renderHook(() => PostHogUserSync());
    userState.data = undefined;
    rerender();

    expect(posthog.stopSessionRecording).toHaveBeenCalled();
    expect(posthog.reset).toHaveBeenCalledWith(true);
  });
});
