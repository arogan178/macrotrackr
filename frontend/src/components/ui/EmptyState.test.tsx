import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("renders title and message", () => {
    render(<EmptyState title="No items" message="Add your first item" />);
    expect(screen.getByText("No items")).toBeDefined();
    expect(screen.getByText("Add your first item")).toBeDefined();
  });

  it("renders action button", () => {
    const onClick = () => {};
    render(<EmptyState title="No items" message="Add item" action={{ label: "Add", onClick }} />);
    expect(screen.getByText("Add")).toBeDefined();
  });

  it("renders secondary action", () => {
    render(
      <EmptyState
        title="No items"
        message="Add item"
        secondaryAction={{ label: "Cancel", onClick: () => {} }}
      />
    );
    expect(screen.getByText("Cancel")).toBeDefined();
  });
});
