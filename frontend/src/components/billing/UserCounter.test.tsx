import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import UserCounter from "./UserCounter";

describe("UserCounter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders without crashing", () => {
    const { container } = render(<UserCounter />);
    expect(container).toBeTruthy();
  });

  it("accepts custom className", () => {
    const { container } = render(<UserCounter className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders initial state", () => {
    const { container } = render(<UserCounter />);
    expect(container).toBeTruthy();

    // Check that "Join" and "users" text are present
    expect(screen.getByText("Join")).toBeInTheDocument();
    expect(screen.getByText("users")).toBeInTheDocument();
  });

  it("renders with memoization", () => {
    const { container } = render(<UserCounter />);
    expect(container.firstChild).toBeTruthy();
    // Verify memo is applied via displayName
    expect(UserCounter.displayName).toBe("UserCounter");
  });

  it("handles timer advancement", () => {
    render(<UserCounter />);

    // Advance timers to trigger the loading state
    vi.advanceTimersByTime(500);

    // Component should still render without error
    expect(screen.getByText("Join")).toBeInTheDocument();
  });

  it("handles full timer progression", async () => {
    render(<UserCounter />);

    // Advance past the load timer and initial animation
    vi.advanceTimersByTime(600);

    // Component should render without error after timer advancement
    expect(screen.getByText("Join")).toBeInTheDocument();
  });
});
