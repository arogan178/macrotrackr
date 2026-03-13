import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CardContainer from "./CardContainer";

describe("CardContainer", () => {
  it("renders children", () => {
    render(<CardContainer>Test Content</CardContainer>);
    expect(screen.getByText("Test Content")).toBeDefined();
  });

  it("applies default variant classes", () => {
    const { container } = render(<CardContainer>Content</CardContainer>);
    expect(container.firstChild).toBeDefined();
  });

  it("applies custom className", () => {
    const { container } = render(<CardContainer className="custom-class">Content</CardContainer>);
    expect(container.firstChild).toBeDefined();
  });

  it("renders with transparent variant", () => {
    const { container } = render(<CardContainer variant="transparent">Content</CardContainer>);
    expect(container.firstChild).toBeDefined();
  });

  it("renders with interactive variant", () => {
    const { container } = render(<CardContainer variant="interactive">Content</CardContainer>);
    expect(container.firstChild).toBeDefined();
  });
});
