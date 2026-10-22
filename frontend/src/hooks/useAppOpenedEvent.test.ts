import { renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const capture = vi.fn();

vi.mock("@/lib/productAnalytics", () => ({
  useProductAnalytics: () => ({ capture }),
}));
vi.mock("@/services/native/platform", () => ({
  getPlatform: () => "android",
}));

const setVisibility = (state: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", { configurable: true, value: state });
  document.dispatchEvent(new Event("visibilitychange"));
};

describe("useAppOpenedEvent", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers();
    capture.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("reports one launch per page load, and nothing while signed out", async () => {
    const { useAppOpenedEvent } = await import("./useAppOpenedEvent");

    renderHook(() => useAppOpenedEvent(false));
    expect(capture).not.toHaveBeenCalled();

    renderHook(() => useAppOpenedEvent(true));
    renderHook(() => useAppOpenedEvent(true));
    expect(capture).toHaveBeenCalledTimes(1);
    expect(capture).toHaveBeenCalledWith({
      event: "app_opened",
      properties: { platform: "android", trigger: "launch" },
    });
  });

  it("counts a return only after half an hour away", async () => {
    const { useAppOpenedEvent } = await import("./useAppOpenedEvent");
    renderHook(() => useAppOpenedEvent(true));
    capture.mockClear();

    setVisibility("hidden");
    vi.advanceTimersByTime(5 * 60 * 1000);
    setVisibility("visible");
    expect(capture).not.toHaveBeenCalled();

    setVisibility("hidden");
    vi.advanceTimersByTime(31 * 60 * 1000);
    setVisibility("visible");
    expect(capture).toHaveBeenCalledWith({
      event: "app_opened",
      properties: { platform: "android", trigger: "resume" },
    });
  });
});
