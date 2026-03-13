import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Badge from "./Badge";

describe("Badge", () => {
  it("renders with text", () => {
    render(<Badge>New</Badge>);
    expect(screen.getByText("New")).toBeDefined();
  });

  it("renders with variant", () => {
    render(<Badge variant="success">Active</Badge>);
    expect(screen.getByText("Active")).toBeDefined();
  });
});
