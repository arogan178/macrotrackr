import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Value from "./Value";

describe("Value", () => {
  it("decides rounding by unit rather than at the call site", () => {
    const { rerender } = render(<Value value={1846.7} unit="kcal" />);
    expect(screen.getByText("1,847")).toBeInTheDocument();

    rerender(<Value value={81.44} unit="kg" />);
    expect(screen.getByText("81.4")).toBeInTheDocument();

    rerender(<Value value={142.6} unit="g" />);
    expect(screen.getByText("143")).toBeInTheDocument();
  });

  it("keeps the unit adjacent and muted", () => {
    render(<Value value={1847} unit="kcal" />);

    const unit = screen.getByText("kcal");
    expect(unit).toHaveClass("text-muted");
  });

  it("signs a delta and never colours it", () => {
    const { container } = render(<Value value={353} unit="kcal" signed suffix="over" />);

    expect(screen.getByText("+353")).toBeInTheDocument();
    expect(container.innerHTML).not.toContain("text-error");
  });

  it("does not sign a negative twice", () => {
    render(<Value value={-120} unit="kcal" signed />);

    expect(screen.getByText("-120")).toBeInTheDocument();
  });

  it("uses tabular figures at every size so columns cannot jitter", () => {
    for (const size of ["hero", "stat", "inline"] as const) {
      const { container, unmount } = render(<Value value={1000} size={size} />);
      expect(container.querySelector(".tabular-nums")).not.toBeNull();
      unmount();
    }
  });

  it("survives a non-finite value", () => {
    render(<Value value={Number.NaN} unit="kcal" />);

    expect(screen.getByText("0")).toBeInTheDocument();
  });
});
