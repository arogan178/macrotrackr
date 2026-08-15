import { act, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import ProductPreview from "./ProductPreview";

afterEach(() => {
  vi.useRealTimers();
});

// Each step schedules the next, so the clock advances once per step.
const advance = (steps: number, ms = 850) => {
  for (let step = 0; step < steps; step++) {
    act(() => {
      vi.advanceTimersByTime(ms);
    });
  }
};

describe("ProductPreview", () => {
  it("lets a scene be picked directly, and stops advancing once it is", () => {
    vi.useFakeTimers();
    render(<ProductPreview />);

    act(() => {
      screen.getByRole("tab", { name: "Hit the goal" }).click();
    });
    expect(screen.getByRole("tab", { name: "Hit the goal" })).toHaveAttribute(
      "aria-selected",
      "true",
    );

    // Well past a full cycle: a chosen scene is not taken away again.
    act(() => {
      vi.advanceTimersByTime(850 + 4400 + 450 + 5000);
    });
    expect(screen.getByRole("tab", { name: "Hit the goal" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("exposes one indicator to the tab sequence", () => {
    render(<ProductPreview />);

    const reachable = screen
      .getAllByRole("tab")
      .filter((tab) => tab.getAttribute("tabindex") !== "-1");

    expect(reachable).toHaveLength(1);
  });

  it("opens on the logging scene and fills it in", () => {
    vi.useFakeTimers();
    render(<ProductPreview />);

    expect(screen.getByText("0 entries")).toBeInTheDocument();
    advance(1);
    expect(screen.getByText("1 entry")).toBeInTheDocument();
  });

  it("adds up to the numbers the app would", () => {
    vi.useFakeTimers();
    render(<ProductPreview />);
    advance(4);

    expect(screen.getByText("4 entries")).toBeInTheDocument();
    // 120p / 168c / 38f => 480 + 672 + 342
    expect(screen.getByText("1,494")).toBeInTheDocument();
    expect(screen.getByText("120")).toBeInTheDocument();
    expect(screen.getByText("168")).toBeInTheDocument();
    expect(screen.getByText("38")).toBeInTheDocument();
  });

  it("hands over to the next scene once the first has played out", () => {
    vi.useFakeTimers();
    render(<ProductPreview />);

    advance(4);
    expect(screen.getByText("Log a day")).toBeInTheDocument();

    // Hold, fade, swap.
    act(() => {
      vi.advanceTimersByTime(2600 + 450);
    });

    // The chart scenes are a separate lazy chunk, so what is observable
    // synchronously is the sequence advancing, not the chart itself.
    expect(screen.getByText("See the week")).toBeInTheDocument();
    expect(screen.queryByText("Log a day")).toBeNull();
  });

  it("returns to the first scene after the third, so it loops", () => {
    vi.useFakeTimers();
    render(<ProductPreview />);

    // Scene one steps four times and holds 2600; the two chart scenes take a
    // single step each and hold 4400 while Recharts draws the line.
    for (const [steps, hold] of [
      [4, 2600],
      [1, 4400],
      [1, 4400],
    ]) {
      advance(steps);
      act(() => {
        vi.advanceTimersByTime(hold + 450);
      });
    }

    expect(screen.getByText("Log a day")).toBeInTheDocument();
  });
});
