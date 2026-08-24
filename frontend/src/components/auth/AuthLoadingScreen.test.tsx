import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AuthLoadingScreen } from "@/components/auth/AuthLoadingScreen";

function setOnLine(value: boolean) {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
}

describe("AuthLoadingScreen", () => {
  const reload = vi.fn();

  beforeEach(() => {
    vi.useFakeTimers();
    reload.mockReset();
    setOnLine(true);
    Object.defineProperty(globalThis, "location", {
      configurable: true,
      value: { ...globalThis.location, reload },
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("spins while auth is still resolving", () => {
    render(<AuthLoadingScreen />);

    expect(screen.queryByText(/You're offline/)).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" }),
    ).not.toBeInTheDocument();
  });

  it("says so immediately when the device is offline", () => {
    setOnLine(false);

    render(<AuthLoadingScreen />);

    expect(screen.getByText(/You're offline/)).toBeInTheDocument();
  });

  it("stops spinning once auth has had long enough", () => {
    render(<AuthLoadingScreen />);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(screen.getByText(/Couldn't confirm your session/)).toBeInTheDocument();
  });

  it("reloads when the connection comes back, since Clerk will not retry", () => {
    setOnLine(false);

    render(<AuthLoadingScreen />);

    act(() => {
      globalThis.dispatchEvent(new Event("online"));
    });

    expect(reload).toHaveBeenCalled();
  });

  it("does not reload on a connection blip while it is still spinning", () => {
    render(<AuthLoadingScreen />);

    act(() => {
      globalThis.dispatchEvent(new Event("online"));
    });

    expect(reload).not.toHaveBeenCalled();
  });
});
