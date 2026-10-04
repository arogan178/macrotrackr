import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

  it("renders add mode defaults with disabled save until a title is typed", async () => {
    const user = userEvent.setup();
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
    expect(screen.getByLabelText("Frequency")).toHaveValue("daily");
    expect(screen.queryByText("Title is required")).not.toBeInTheDocument();
    const save = screen.getByRole("button", { name: "Save Habit" });
    expect(save).toBeDisabled();

    await user.type(screen.getByLabelText("Habit Title"), "   ");
    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(save).toBeDisabled();

    await user.type(screen.getByLabelText("Habit Title"), "Walk");
    expect(screen.queryByText("Title is required")).not.toBeInTheDocument();
    expect(save).toBeEnabled();

    await user.clear(screen.getByLabelText("Habit Title"));
    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(save).toBeDisabled();
  });

  it("prefills edit mode, including a weekly frequency, and keeps it across renders", () => {
    const habit: HabitGoal = { ...baseHabit, frequency: "weekly" };
    const properties = {
      isOpen: true,
      onClose: vi.fn(),
      onSubmit: vi.fn().mockResolvedValue(undefined),
      habit,
      mode: "edit" as const,
    };
    const { rerender } = render(<HabitModal {...properties} />);
    rerender(<HabitModal {...properties} />);

    expect(screen.getByText("Edit Habit")).toBeInTheDocument();
    expect(screen.getByLabelText("Habit Title")).toHaveValue("Read");
    expect(screen.getByLabelText("Target")).toHaveValue(10);
    expect(screen.getByLabelText("Frequency")).toHaveValue("weekly");
    expect(
      screen.getByRole("button", { name: "Book icon" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Select Purple color" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
    expect(document.querySelector('input[name="current"]')).toHaveAttribute(
      "value",
      "3",
    );
  });

  it("restarts the preview's progress when the frequency changes", async () => {
    const user = userEvent.setup();
    render(
      <HabitModal
        isOpen
        onClose={vi.fn()}
        onSubmit={vi.fn().mockResolvedValue(undefined)}
        habit={baseHabit}
        mode="edit"
      />,
    );
    const current = () => document.querySelector('input[name="current"]');

    expect(current()).toHaveAttribute("value", "3");
    await user.selectOptions(screen.getByLabelText("Frequency"), "weekly");
    expect(current()).toHaveAttribute("value", "0");
    await user.selectOptions(screen.getByLabelText("Frequency"), "daily");
    expect(current()).toHaveAttribute("value", "3");
  });

  it("submits add mode form with the chosen values", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);

    render(
      <HabitModal isOpen onClose={vi.fn()} onSubmit={onSubmit} mode="add" />,
    );

    await user.type(screen.getByLabelText("Habit Title"), "Walk");
    await user.type(screen.getByLabelText("Target"), "{Backspace}2");
    await user.selectOptions(screen.getByLabelText("Frequency"), "weekly");
    await user.click(screen.getByRole("button", { name: "Calendar icon" }));
    await user.click(screen.getByRole("button", { name: "Select Red color" }));
    await user.click(screen.getByRole("button", { name: "Save Habit" }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      {
        title: "Walk",
        iconName: "calendar",
        target: 12,
        accentColor: "red",
        frequency: "weekly",
      },
      undefined,
    );
  });

  it("submits edit mode with habit id", async () => {
    const user = userEvent.setup();
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

    await user.type(screen.getByLabelText("Habit Title"), " more");
    await user.click(screen.getByRole("button", { name: "Save Changes" }));

    expect(onSubmit).toHaveBeenCalledWith(
      {
        title: "Read more",
        iconName: "book",
        target: 10,
        accentColor: "purple",
        frequency: "daily",
      },
      "habit-1",
    );
  });

  it("shows Saving... while the save is in flight", async () => {
    const user = userEvent.setup();
    let resolveSave: () => void = () => {};
    const onSubmit = vi.fn(
      () => new Promise<void>((resolve) => (resolveSave = resolve)),
    );

    render(
      <HabitModal
        isOpen
        onClose={vi.fn()}
        onSubmit={onSubmit}
        habit={baseHabit}
        mode="edit"
      />,
    );

    await user.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(screen.getByRole("button", { name: "Saving..." })).toBeDisabled();

    await act(async () => resolveSave());
  });

  it("shows error notification and resets submitting state on submit failure", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockRejectedValue(new Error("Unable to save"));

    render(
      <HabitModal isOpen onClose={vi.fn()} onSubmit={onSubmit} mode="add" />,
    );

    await user.type(screen.getByLabelText("Habit Title"), "Meditate");
    await user.click(screen.getByRole("button", { name: "Save Habit" }));

    expect(showNotification).toHaveBeenCalledWith("Unable to save", "error");
    expect(screen.getByRole("button", { name: "Save Habit" })).toBeEnabled();
    expect(screen.getByLabelText("Habit Title")).toHaveValue("Meditate");
  });

  it("starts afresh each time it opens", async () => {
    const user = userEvent.setup();
    const properties = {
      onClose: vi.fn(),
      onSubmit: vi.fn().mockResolvedValue(undefined),
    };
    const { rerender } = render(
      <HabitModal {...properties} isOpen habit={baseHabit} mode="edit" />,
    );

    await user.clear(screen.getByLabelText("Habit Title"));
    expect(screen.getByText("Title is required")).toBeInTheDocument();

    rerender(<HabitModal {...properties} isOpen={false} mode="add" />);
    rerender(<HabitModal {...properties} isOpen mode="add" />);

    expect(screen.getByLabelText("Habit Title")).toHaveValue("");
    expect(screen.getByLabelText("Target")).toHaveValue(10);
    expect(screen.queryByText("Title is required")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save Habit" })).toBeDisabled();

    rerender(<HabitModal {...properties} isOpen={false} mode="add" />);
    rerender(<HabitModal {...properties} isOpen habit={baseHabit} mode="edit" />);

    expect(screen.getByLabelText("Habit Title")).toHaveValue("Read");
    expect(screen.getByRole("button", { name: "Save Changes" })).toBeEnabled();
  });
});
