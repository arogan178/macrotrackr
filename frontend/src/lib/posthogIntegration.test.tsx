import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Stands in for posthog-js's persisted identity, which outlives a page load.
const device = { distinctId: "device_a", identified: false, recording: false };
const posthog = {
  init: vi.fn(),
  identify: vi.fn((distinctId: string) => {
    device.distinctId = distinctId;
    device.identified = true;
  }),
  reset: vi.fn(() => {
    if (device.recording) throw new Error("reset while still recording");
    device.distinctId = "device_b";
    device.identified = false;
  }),
  _isIdentified: () => device.identified,
  startSessionRecording: vi.fn(() => {
    device.recording = true;
  }),
  stopSessionRecording: vi.fn(() => {
    device.recording = false;
  }),
};

const authState = { isLoaded: true, isSignedIn: false };
const signedInUser = {
  id: "1",
  subscription: { status: "free" },
  createdAt: "2026-01-01",
  analyticsTrafficType: "organic",
};
const userState: { data: typeof signedInUser | undefined } = { data: undefined };

vi.mock("posthog-js", () => ({ default: posthog }));
vi.mock("@/hooks/auth/useAuthState", () => ({ useAppAuthState: () => authState }));
vi.mock("@/hooks/auth/useAuthQueries", () => ({ useUser: () => userState }));

const { loadPostHog } = await import("./posthogClient");
const { default: PostHogUserSync } = await import("./posthogIntegration");

function signIn() {
  authState.isSignedIn = true;
  userState.data = signedInUser;
}

describe("PostHogUserSync", () => {
  beforeEach(() => {
    Object.assign(device, { distinctId: "device_a", identified: false, recording: false });
    Object.assign(authState, { isLoaded: true, isSignedIn: false });
    userState.data = undefined;
  });

  // Runs first because posthog-js only loads once per module.
  it("unlinks a device still identified from an earlier page load, even before posthog-js loads", async () => {
    Object.assign(device, { distinctId: "1", identified: true });
    renderHook(() => PostHogUserSync());

    await loadPostHog("phc_key", {});

    expect(device.distinctId).toBe("device_b");
  });

  it("leaves an anonymous visitor's device id and recorder alone", () => {
    renderHook(() => PostHogUserSync());

    expect(device).toEqual({ distinctId: "device_a", identified: false, recording: false });
  });

  it("identifies and records once someone signs in", () => {
    signIn();
    renderHook(() => PostHogUserSync());

    expect(device).toEqual({ distinctId: "1", identified: true, recording: true });
  });

  it("stops recording and unlinks the device when the session ends while the profile is still cached", () => {
    signIn();
    const { rerender } = renderHook(() => PostHogUserSync());

    // Logout clears the query cache without re-rendering this component, so
    // the last profile it saw is still the one it holds.
    authState.isSignedIn = false;
    rerender();

    expect(device).toEqual({ distinctId: "device_b", identified: false, recording: false });
  });

  it("identifies again when the same person signs back in", () => {
    signIn();
    const { rerender } = renderHook(() => PostHogUserSync());
    authState.isSignedIn = false;
    rerender();

    authState.isSignedIn = true;
    rerender();

    expect(device).toEqual({ distinctId: "1", identified: true, recording: true });
  });
});
