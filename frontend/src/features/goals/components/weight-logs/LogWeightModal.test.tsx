import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LogWeightModal from "./LogWeightModal";

const addWeightLog = vi.fn();
const updateWeightLog = vi.fn();

vi.mock("@/hooks/queries/useGoals", () => ({
  useAddWeightLogEntry: () => ({ isPending: false, mutateAsync: addWeightLog }),
  useUpdateWeightLogEntry: () => ({
    isPending: false,
    mutateAsync: updateWeightLog,
  }),
}));

vi.mock("@/components/ui/Modal", () => ({
  default: ({
    isOpen,
    onSave,
    saveDisabled,
    saveLabel,
    children,
  }: {
    isOpen: boolean;
    onSave?: () => void;
    saveDisabled?: boolean;
    saveLabel?: string;
    children: React.ReactNode;
  }) =>
    isOpen ? (
      <div>
        <button onClick={onSave} disabled={saveDisabled} type="button">
          {saveLabel}
        </button>
        {children}
      </div>
    ) : null,
}));

describe("LogWeightModal", () => {
  beforeEach(() => {
    addWeightLog.mockReset();
    addWeightLog.mockResolvedValue({});
    updateWeightLog.mockReset();
    updateWeightLog.mockResolvedValue({});
  });

  it("takes a weight in lb and logs it in kg", async () => {
    const user = userEvent.setup();
    render(<LogWeightModal isOpen onClose={vi.fn()} unitSystem="imperial" />);

    const input = screen.getByLabelText("Weight");
    await user.type(input, "165.5");
    expect(input).toHaveValue(165.5);
    expect(screen.getByText("lb")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Log Weight" }));

    await waitFor(() => expect(addWeightLog).toHaveBeenCalledTimes(1));
    expect(addWeightLog.mock.calls[0][0].weight).toBe(75.07);
  });

  it("shows a stored kg weight in lb", () => {
    render(
      <LogWeightModal
        isOpen
        onClose={vi.fn()}
        initialWeight={80}
        unitSystem="imperial"
      />,
    );

    expect(screen.getByLabelText("Weight")).toHaveValue(176.4);
  });

  it("states the limits in lb", async () => {
    const user = userEvent.setup();
    render(<LogWeightModal isOpen onClose={vi.fn()} unitSystem="imperial" />);

    await user.type(screen.getByLabelText("Weight"), "100");
    await user.click(screen.getByRole("button", { name: "Log Weight" }));

    expect(screen.getByText("Weight must be at least 111 lb.")).toBeInTheDocument();
    expect(addWeightLog).not.toHaveBeenCalled();
  });

  it("edits an entry in place, prefilled in the user's unit", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const timestamp = "2026-09-20T08:30:00.000Z";
    render(
      <LogWeightModal
        isOpen
        onClose={onClose}
        unitSystem="imperial"
        entry={{ id: "entry-1", timestamp, weight: 80 }}
      />,
    );

    const input = screen.getByLabelText("Weight");
    expect(input).toHaveValue(176.4);

    await user.clear(input);
    await user.type(input, "175");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(updateWeightLog).toHaveBeenCalledTimes(1));
    expect(updateWeightLog).toHaveBeenCalledWith({
      id: "entry-1",
      weight: 79.38,
      timestamp,
    });
    expect(addWeightLog).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("keeps an untouched weight exact when saving an edit", async () => {
    const user = userEvent.setup();
    render(
      <LogWeightModal
        isOpen
        onClose={vi.fn()}
        unitSystem="imperial"
        entry={{ id: "entry-1", timestamp: "2026-09-20T08:30:00.000Z", weight: 80 }}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => expect(updateWeightLog).toHaveBeenCalledTimes(1));
    expect(updateWeightLog.mock.calls[0][0].weight).toBe(80);
  });
});
