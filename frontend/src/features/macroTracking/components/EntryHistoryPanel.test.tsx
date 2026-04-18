import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import EntryHistoryPanel from "./EntryHistoryPanel";

describe("EntryHistoryPanel", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <EntryHistoryPanel
        history={[]}
        deleteEntry={() => {}}
        onEdit={() => {}}
        isDeleting={false}
        isEditing={false}
      />,
    );
    expect(container).toBeDefined();
  });
});
