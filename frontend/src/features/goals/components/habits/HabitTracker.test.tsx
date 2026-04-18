import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import HabitTracker from "./HabitTracker";

vi.mock("@/hooks/queries/useGoals", () => ({
  useGoals: () => ({ data: null, isLoading: false }),
}));

describe("HabitTracker", () => {
  it("renders without crashing", () => {
    const { container } = render(<HabitTracker />);
    expect(container).toBeDefined();
  });
});
