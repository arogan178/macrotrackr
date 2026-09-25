import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DayNavigator from "./DayNavigator";

vi.mock("@/hooks/useEntitlements", () => ({
  useEntitlements: () => ({ hasProAccess: false }),
}));

const today = "2026-09-25";

function renderNavigator(date: string, oldestDate?: string) {
  const onChange = vi.fn();
  render(
    <DayNavigator
      date={date}
      today={today}
      oldestDate={oldestDate}
      onChange={onChange}
    />,
  );

  return onChange;
}

describe("DayNavigator", () => {
  it("cannot move past today", () => {
    const onChange = renderNavigator(today);

    expect(screen.getByRole("button", { name: "Next day" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Today" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
    expect(onChange).toHaveBeenCalledWith("2026-09-24");
  });

  it("moves a day either way and jumps back to today", () => {
    const onChange = renderNavigator("2026-09-20");

    fireEvent.click(screen.getByRole("button", { name: "Previous day" }));
    fireEvent.click(screen.getByRole("button", { name: "Next day" }));
    fireEvent.click(screen.getByRole("button", { name: "Today" }));

    expect(onChange.mock.calls).toEqual([
      ["2026-09-19"],
      ["2026-09-21"],
      [today],
    ]);
  });

  it("locks the previous day behind Pro at the free history limit", () => {
    document.body.insertAdjacentHTML("beforeend", '<div id="modal-root"></div>');
    const onChange = renderNavigator("2026-09-18", "2026-09-18");
    expect(screen.getByLabelText("Pro feature")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Previous day" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText("Unlock Pro Features")).toBeInTheDocument();
  });
});
