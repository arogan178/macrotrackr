import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Tooltip from "./Tooltip";

describe("Tooltip", () => {
  it("renders children", () => {
    render(<Tooltip content="Help text"><span>Hover me</span></Tooltip>);
    expect(screen.getByText("Hover me")).toBeDefined();
  });
});
