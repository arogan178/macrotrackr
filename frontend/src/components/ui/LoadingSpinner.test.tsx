import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import LoadingSpinner from "./LoadingSpinner";

describe("LoadingSpinner", () => {
  it("renders spinner", () => {
    render(<LoadingSpinner />);
    expect(screen.getByRole("status")).toBeDefined();
  });

  it("renders with label", () => {
    render(<LoadingSpinner label="Loading data" />);
    expect(screen.getByText("Loading data")).toBeDefined();
  });

  it("renders with custom size", () => {
    const { container } = render(<LoadingSpinner size="lg" />);
    expect(container.firstChild).toBeDefined();
  });
});
