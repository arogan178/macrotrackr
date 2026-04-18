import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import StatusBadge from "./StatusBadge";

describe("StatusBadge", () => {
  it("renders without crashing", () => {
    const { container } = render(<StatusBadge />);
    expect(container).toBeDefined();
  });
});
