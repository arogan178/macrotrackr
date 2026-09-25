import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import LogWeightModal from "./LogWeightModal";

const addWeightLog = vi.fn();

vi.mock("@/hooks/queries/useGoals", () => ({
  useAddWeightLogEntry: () => ({ isPending: false, mutateAsync: addWeightLog }),
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
});
