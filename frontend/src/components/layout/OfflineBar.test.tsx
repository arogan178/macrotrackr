import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import OfflineBar from "./OfflineBar";

const setOnline = (value: boolean) => {
  Object.defineProperty(navigator, "onLine", {
    configurable: true,
    value,
  });
};

afterEach(() => {
  setOnline(true);
  vi.restoreAllMocks();
});

describe("OfflineBar", () => {
  it("says nothing while online", () => {
    setOnline(true);
    render(<OfflineBar />);

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("explains the state once, rather than leaving each panel empty", () => {
    setOnline(false);
    render(<OfflineBar />);

    expect(screen.getByRole("status")).toHaveTextContent(/Offline/);
  });

  it("appears and disappears with the connection", () => {
    setOnline(true);
    render(<OfflineBar />);

    act(() => {
      setOnline(false);
      globalThis.dispatchEvent(new Event("offline"));
    });
    expect(screen.getByRole("status")).toBeInTheDocument();

    act(() => {
      setOnline(true);
      globalThis.dispatchEvent(new Event("online"));
    });
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });
});
