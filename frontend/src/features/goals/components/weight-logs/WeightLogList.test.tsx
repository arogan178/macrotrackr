import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useStore } from "@/store/store";

import WeightLogList from "./WeightLogList";

vi.mock("@/hooks/queries/useGoals", () => ({
  useWeightLog: () => ({ data: [], isLoading: false }),
  useDeleteWeightLogEntry: () => ({ isPending: false, mutateAsync: vi.fn() }),
}));

describe("WeightLogList", () => {
  beforeEach(() => {
    useStore.setState({ isLogWeightModalOpen: false });
  });

  it("opens the log weight modal from the empty state", async () => {
    render(<WeightLogList />);

    await userEvent.click(screen.getByRole("button", { name: "Log Weight" }));

    expect(useStore.getState().isLogWeightModalOpen).toBe(true);
  });
});
