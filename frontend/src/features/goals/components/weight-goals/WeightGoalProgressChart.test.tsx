import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useStore } from "@/store/store";

import WeightGoalProgressChart from "./WeightGoalProgressChart";

vi.mock("@/hooks/queries/useGoals", () => ({
  useWeightLog: () => ({ data: [], isLoading: false }),
  useWeightGoals: () => ({ data: null, isLoading: false }),
}));

describe("WeightGoalProgressChart", () => {
  beforeEach(() => {
    // recharts' ResponsiveContainer needs it and jsdom has none
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        unobserve() {}
        disconnect() {}
      },
    );
    useStore.setState({ isLogWeightModalOpen: false });
  });

  it("opens the log weight modal from the empty state", async () => {
    render(<WeightGoalProgressChart />);

    await userEvent.click(screen.getByRole("button", { name: "Log Weight" }));

    expect(useStore.getState().isLogWeightModalOpen).toBe(true);
  });
});
