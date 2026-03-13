import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Tabs from "./Tabs";

describe("Tabs", () => {
  it("renders tabs", () => {
    const tabs = [
      { id: "tab1", label: "Tab 1", content: <div>Content 1</div> },
      { id: "tab2", label: "Tab 2", content: <div>Content 2</div> },
    ];
    render(<Tabs tabs={tabs} />);
    expect(screen.getByText("Tab 1")).toBeDefined();
  });
});
