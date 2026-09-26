import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import HabitCard from "./HabitCard";

const actions = {
  onIncrement: vi.fn(async () => {}),
  onComplete: vi.fn(async () => {}),
  onDelete: vi.fn(async () => {}),
};

function renderCard(current: number, frequency?: "weekly") {
  render(
    <HabitCard
      habit={{
        id: "h1",
        title: "Log every meal",
        iconName: "target",
        current,
        target: 3,
        isComplete: current >= 3,
        frequency,
      }}
      actions={actions}
    />,
  );

  return screen.getByRole("heading", { name: "Log every meal" }).parentElement!
    .parentElement!;
}

describe("HabitCard", () => {
  // On a phone the title and four buttons cannot share one line.
  it("lets the actions wrap below the title instead of squeezing it", () => {
    const header = renderCard(1);

    expect(header).toHaveClass("flex-wrap");
    expect(header).toContainElement(
      screen.getByRole("button", { name: "More actions" }),
    );
  });

  it("shows Complete beside the figure, not in the header", () => {
    const header = renderCard(3);
    const badge = screen.getByText("Complete");

    expect(header).not.toContainElement(badge);
    expect(badge.parentElement).toHaveTextContent(/3\s*\/\s*3/);
  });

  it("says a weekly figure counts this week", () => {
    renderCard(1, "weekly");

    expect(screen.getByText(/this week/)).toBeInTheDocument();
  });
});
