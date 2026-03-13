import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EntryHistoryPanel from "./EntryHistoryPanel";

describe("EntryHistoryPanel", () => {
  it("renders without crashing", () => {
    const { container } = render(<EntryHistoryPanel />);
    expect(container).toBeDefined();
  });
});
