import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import UpdatePrompt from "./UpdatePrompt";

describe("UpdatePrompt", () => {
  let mockWorker: { postMessage: ReturnType<typeof vi.fn> };
  let mockRegistration: {
    waiting: typeof mockWorker | null;
    addEventListener: ReturnType<typeof vi.fn>;
  };
  let swEventListeners: Record<string, () => void>;

  beforeEach(() => {
    mockWorker = {
      postMessage: vi.fn(),
    };

    mockRegistration = {
      waiting: mockWorker,
      addEventListener: vi.fn(),
    };

    swEventListeners = {};

    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: {
        getRegistration: vi.fn().mockResolvedValue(mockRegistration),
        addEventListener: vi.fn((event: string, handler: () => void) => {
          swEventListeners[event] = handler;
        }),
      },
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders prompt when service worker update is waiting", async () => {
    await act(async () => {
      render(<UpdatePrompt />);
    });

    expect(screen.getByText("A new version is ready.")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Later" })).toBeInTheDocument();
  });

  it("dismisses prompt when Later is clicked", async () => {
    await act(async () => {
      render(<UpdatePrompt />);
    });

    fireEvent.click(screen.getByRole("button", { name: "Later" }));
    expect(screen.queryByText("A new version is ready.")).not.toBeInTheDocument();
  });

  it("shows loading indicator and disables buttons when Update is clicked", async () => {
    await act(async () => {
      render(<UpdatePrompt />);
    });

    const updateButton = screen.getByRole("button", { name: "Update" });
    const laterButton = screen.getByRole("button", { name: "Later" });

    fireEvent.click(updateButton);

    expect(mockWorker.postMessage).toHaveBeenCalledWith({ type: "SKIP_WAITING" });
    expect(updateButton).toHaveAttribute("aria-busy", "true");
    expect(updateButton).toBeDisabled();
    expect(laterButton).toBeDisabled();
    expect(screen.getByText("Updating…")).toBeInTheDocument();
  });
});
