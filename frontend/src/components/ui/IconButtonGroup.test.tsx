import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import IconButtonGroup from "./IconButtonGroup";

describe("IconButtonGroup", () => {
  it("renders without crashing", () => {
    const { container } = render(<IconButtonGroup />);
    expect(container).toBeDefined();
  });
});
