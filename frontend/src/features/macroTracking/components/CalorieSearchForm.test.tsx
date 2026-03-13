import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CalorieSearchForm from "./CalorieSearchForm";

describe("CalorieSearchForm", () => {
  it("renders without crashing", () => {
    const { container } = render(<CalorieSearchForm />);
    expect(container).toBeDefined();
  });
});
