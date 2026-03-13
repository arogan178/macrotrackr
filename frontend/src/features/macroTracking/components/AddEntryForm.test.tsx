import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import AddEntryForm from "./AddEntryForm";

describe("AddEntryForm", () => {
  it("renders without crashing", () => {
    const { container } = render(<AddEntryForm />);
    expect(container).toBeDefined();
  });
});
