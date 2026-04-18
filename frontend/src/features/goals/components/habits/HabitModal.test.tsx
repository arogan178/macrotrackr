import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach,describe, expect, it, vi } from "vitest";

import type { HabitGoal } from "@/types/habit";

import HabitModal from "./HabitModal";

const showNotification = vi.fn();

vi.mock("@/store/store", () => ({
  useStore: () => ({
    showNotification,
  }),
}));

vi.mock("@/components/ui/Modal", () => ({
  default: ({
    isOpen,
    title,
    onClose,
    onSave,
    saveDisabled,
    saveLabel,
    children,
  }: {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    onSave?: () => void;
    saveDisabled?: boolean;
    saveLabel?: string;
    children: React.ReactNode;
  }) => {
    if (!isOpen) return null;

    return (
      <div data-testid="mock-modal">
        <h2>{title}</h2>
        <button onClick={onClose} type="button">
          Close
        </button>
        <button onClick={onSave} disabled={saveDisabled} type="button">
          {saveLabel}
        </button>
        {children}
      </div>
    );
  },
}));

const baseHabit: HabitGoal = {
  id: "habit-1",
  title: "Read",
  iconName: "book",
  current: 3,
  target: 10,
  progress: 30,
  accentColor: "purple",
  createdAt: "2026-01-01T00:00:00Z",
};

describe("HabitModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders add mode defaults with disabled save until valid", () => {
    render(
      <HabitModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        mode="add"
      />,
    );

    expect(screen.getByText("Add New Habit")).toBeInTheDocument();
    expect(screen.getByLabelText("Habit Title")).toHaveValue("");
    expect(screen.getByLabelText("Target")).toHaveValue(10);
    expect(screen.getByRole("button", { name: "Save Habit" })).toBeDisabled();
  });

  it("renders edit mode values and uses edit save label", () => {
    render(
      <HabitModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        habit={baseHabit}
        mode="edit"
      />,
    );

    expect(screen.getByText("Edit Habit")).toBeInTheDocument();
    expect(screen.getByLabelText("Habit Title")).toHaveValue("Read");
    expect(screen.getByLabelText("Target")).toHaveValue(10);
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();

    const currentHidden = document.querySelector('input[name="current"]');
    expect(currentHidden).toHaveAttribute("value", "3");
  });

  it("submits add mode form with updated values", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <HabitModal isOpen onClose={vi.fn()} onSubmit={onSubmit} mode="add" />,
    );

    fireEvent.change(screen.getByLabelText("Habit Title"), {
      target: { value: "Walk" },
    });
    fireEvent.change(screen.getByLabelText("Target"), {
      target: { value: "12" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Habit" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Walk",
        target: 12,
      }),
      undefined,
    );
  });

  it("submits edit mode with habit id", async () => {
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <HabitModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        habit={baseHabit}
        mode="edit"
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Read",
        target: 10,
      }),
      "habit-1",
    );
  });

  it("shows error notification and resets submitting state on submit failure", async () => {
    const onSubmit = vi.fn().mockRejectedValue(new Error("Unable to save"));

    render(
      <HabitModal isOpen onClose={vi.fn()} onSubmit={onSubmit} mode="add" />,
    );

    fireEvent.change(screen.getByLabelText("Habit Title"), {
      target: { value: "Meditate" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save Habit" }));

    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith("Unable to save", "error");
    });

    expect(screen.getByRole("button", { name: "Save Habit" })).toBeEnabled();
  });
});
