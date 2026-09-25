import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HabitActions from "./HabitActions";

function renderActions(current: number, isComplete: boolean) {
  const handlers = {
    onIncrement: vi.fn(async () => {}),
    onComplete: vi.fn(async () => {}),
    onDecrement: vi.fn(async () => {}),
    onReset: vi.fn(async () => {}),
    onEdit: vi.fn(),
    onDelete: vi.fn(async () => {}),
  };

  render(
    <HabitActions
      habitId="h1"
      current={current}
      isComplete={isComplete}
      {...handlers}
    />,
  );

  return handlers;
}

describe("HabitActions", () => {
  it("removes one unit of progress", async () => {
    const { onDecrement } = renderActions(3, false);

    fireEvent.click(screen.getByRole("button", { name: "Remove progress" }));

    await waitFor(() => expect(onDecrement).toHaveBeenCalledWith("h1"));
  });

  it("offers nothing to undo at 0", () => {
    renderActions(0, false);

    expect(
      screen.queryByRole("button", { name: "Remove progress" }),
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(
      screen.queryByRole("button", { name: "Reset today" }),
    ).not.toBeInTheDocument();
  });

  it("lets a completed habit be undone or reset", async () => {
    const { onDecrement, onReset } = renderActions(8, true);

    expect(
      screen.queryByRole("button", { name: "Add progress" }),
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Remove progress" }));
    await waitFor(() => expect(onDecrement).toHaveBeenCalledWith("h1"));

    fireEvent.click(screen.getByRole("button", { name: "More actions" }));
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Reset today" }));
    await waitFor(() => expect(onReset).toHaveBeenCalledWith("h1"));
  });
});
