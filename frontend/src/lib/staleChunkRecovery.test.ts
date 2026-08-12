import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { registerStaleChunkRecovery } from "./staleChunkRecovery";

const reload = vi.fn();

function firePreloadError() {
  const event = new Event("vite:preloadError", { cancelable: true });
  globalThis.dispatchEvent(event);

  return event;
}

describe("registerStaleChunkRecovery", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorage.clear();
    Object.defineProperty(globalThis, "location", {
      configurable: true,
      value: { ...globalThis.location, reload },
    });
    registerStaleChunkRecovery();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it("reloads once when a lazy chunk fails to load", () => {
    const event = firePreloadError();

    expect(reload).toHaveBeenCalledOnce();
    expect(event.defaultPrevented).toBe(true);
  });

  it("does not loop if the reload did not resolve it", () => {
    firePreloadError();
    expect(reload).toHaveBeenCalledOnce();

    // Simulate the page coming back and failing again straight away.
    const second = firePreloadError();

    expect(reload).toHaveBeenCalledOnce();
    // Left unhandled so the error boundary can surface it.
    expect(second.defaultPrevented).toBe(false);
  });

  it("retries again once the cooldown has passed", () => {
    firePreloadError();
    expect(reload).toHaveBeenCalledOnce();

    sessionStorage.setItem(
      "stale-chunk-reloaded-at",
      (Date.now() - 60_000).toString(),
    );

    firePreloadError();

    expect(reload).toHaveBeenCalledTimes(2);
  });
});
