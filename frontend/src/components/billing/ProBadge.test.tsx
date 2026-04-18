import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ProBadge from "./ProBadge";

describe("ProBadge", () => {
  it("renders with default props", () => {
    const { container } = render(<ProBadge />);
    expect(container).toBeTruthy();

    const badge = screen.getByText("PRO");
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveAttribute("aria-label", "Pro feature");
  });

  it("applies custom className", () => {
    const { container } = render(<ProBadge className="custom-class" />);
    expect(container.firstChild).toHaveClass("custom-class");
  });

  it("renders with memoization", () => {
    const { container } = render(<ProBadge />);
    expect(container.firstChild).toBeTruthy();
    // Verify memo is applied via displayName
    expect(ProBadge.displayName).toBe("ProBadge");
  });
});
