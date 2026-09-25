import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useStore } from "@/store/store";

import WeightLogList from "./WeightLogList";

const weightLog = vi.hoisted(() => ({
  entries: [] as { id: string; timestamp: string; weight: number }[],
}));
const updateWeightLog = vi.hoisted(() => vi.fn());

vi.mock("@/hooks/queries/useGoals", () => ({
  useWeightLog: () => ({ data: weightLog.entries, isLoading: false }),
  useDeleteWeightLogEntry: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useAddWeightLogEntry: () => ({ isPending: false, mutateAsync: vi.fn() }),
  useUpdateWeightLogEntry: () => ({
    isPending: false,
    mutateAsync: updateWeightLog,
  }),
}));

describe("WeightLogList", () => {
  beforeEach(() => {
    useStore.setState({ isLogWeightModalOpen: false });
    weightLog.entries = [];
    updateWeightLog.mockReset();
    updateWeightLog.mockResolvedValue({});
  });

  it("opens the log weight modal from the empty state", async () => {
    render(<WeightLogList />);

    await userEvent.click(screen.getByRole("button", { name: "Log Weight" }));

    expect(useStore.getState().isLogWeightModalOpen).toBe(true);
  });

  it("edits an entry from its row", async () => {
    const timestamp = "2026-09-20T08:30:00.000Z";
    weightLog.entries = [{ id: "entry-1", timestamp, weight: 80 }];
    if (!document.querySelector("#modal-root")) {
      const modalRoot = document.createElement("div");
      modalRoot.setAttribute("id", "modal-root");
      document.body.append(modalRoot);
    }
    render(<WeightLogList unitSystem="imperial" />);

    expect(screen.getByText("176.4 lb")).toBeInTheDocument();

    await userEvent.click(
      screen.getByRole("button", { name: /^Edit entry from/ }),
    );
    const input = screen.getByLabelText("Weight");
    expect(input).toHaveValue(176.4);

    await userEvent.clear(input);
    await userEvent.type(input, "175");
    await userEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() =>
      expect(updateWeightLog).toHaveBeenCalledWith({
        id: "entry-1",
        weight: 79.38,
        timestamp,
      }),
    );
  });
});
