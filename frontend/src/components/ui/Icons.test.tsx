import { render } from "@testing-library/react";
import { describe, expect,it } from "vitest";

import { HomeIcon } from "./Icons";

describe("Icons", () => {
  it("should render some icons", () => {
    const { container } = render(<HomeIcon />);
    expect(container.querySelector("svg")).toBeInTheDocument();
  });
});
