import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import WeightGoalStatus from "./WeightGoalStatus";

vi.mock("@/hooks/queries/useGoals", () => ({
  useGoals: () => ({ data: null, isLoading: false }),
}));

describe("WeightGoalStatus", () => {
  it("renders without crashing", () => {
    const { container } = render(<WeightGoalStatus />);
    expect(container).toBeDefined();
  });
});
