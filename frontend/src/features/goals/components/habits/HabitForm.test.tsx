import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";

import type { HabitGoalFormValues } from "@/types/habit";

import HabitForm, { useHabitForm } from "./HabitForm";

const baseValues: HabitGoalFormValues = {
  title: "Drink Water",
  iconName: "target",
  target: 10,
  accentColor: "indigo",
};

function renderForm(currentProgress?: number) {
  function Harness() {
    const form = useHabitForm(baseValues, async () => {});

    return <HabitForm form={form} currentProgress={currentProgress} />;
  }

  return render(<Harness />);
}

describe("HabitForm", () => {
  it("renders form fields, preview, and hidden progress inputs", () => {
    const { container } = renderForm(7);

    expect(screen.getByLabelText("Habit Title")).toHaveValue("Drink Water");
    expect(screen.getByLabelText("Target")).toHaveValue(10);
    expect(
      screen.getByRole("group", { name: "Icon selection" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("group", { name: "Color selection" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Preview")).toBeInTheDocument();

    const iconHidden = container.querySelector('input[name="iconName"]');
    const colorHidden = container.querySelector('input[name="accentColor"]');
    const currentHidden = container.querySelector('input[name="current"]');
    const progressHidden = container.querySelector('input[name="progress"]');

    expect(iconHidden).toHaveAttribute("value", "target");
    expect(colorHidden).toHaveAttribute("value", "indigo");
    expect(currentHidden).toHaveAttribute("value", "7");
    expect(progressHidden).toHaveAttribute("value", "70");
  });

  it("shows the typed title in the preview", async () => {
    const user = userEvent.setup();
    renderForm();

    const title = screen.getByLabelText("Habit Title");
    await user.clear(title);
    await user.type(title, "Read 20 pages");

    expect(title).toHaveValue("Read 20 pages");
    expect(screen.getByText("Read 20 pages")).toBeInTheDocument();
  });

  it("clamps target values to at least 1", async () => {
    const user = userEvent.setup();
    const { container } = renderForm(5);
    const target = screen.getByLabelText("Target");

    await user.clear(target);
    expect(target).toHaveValue(1);

    await user.type(target, "0", {
      initialSelectionStart: 0,
      initialSelectionEnd: 1,
    });
    expect(target).toHaveValue(1);

    await user.type(target, "2");
    expect(target).toHaveValue(12);
    expect(container.querySelector('input[name="progress"]')).toHaveAttribute(
      "value",
      "42",
    );
  });

  it("updates selected icon and color via button groups", async () => {
    const user = userEvent.setup();
    const { container } = renderForm();

    await user.click(screen.getByRole("button", { name: "Calendar icon" }));
    await user.click(screen.getByRole("button", { name: "Select Red color" }));

    expect(
      screen.getByRole("button", { name: "Calendar icon" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByRole("button", { name: "Target icon" }),
    ).toHaveAttribute("aria-pressed", "false");
    expect(
      screen.getByRole("button", { name: "Select Red color" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(container.querySelector('input[name="iconName"]')).toHaveAttribute(
      "value",
      "calendar",
    );
    expect(
      container.querySelector('input[name="accentColor"]'),
    ).toHaveAttribute("value", "red");
  });

  it("offers a weekly frequency and explains when it resets", async () => {
    const user = userEvent.setup();
    renderForm();

    expect(screen.getByLabelText("Frequency")).toHaveValue("daily");
    expect(
      screen.getByText("How many times a day. Progress resets at midnight."),
    ).toBeInTheDocument();

    await user.selectOptions(screen.getByLabelText("Frequency"), "weekly");

    expect(screen.getByLabelText("Frequency")).toHaveValue("weekly");
    expect(
      screen.getByText("How many times a week. Progress resets on Monday."),
    ).toBeInTheDocument();
    expect(screen.getByText(/this week/)).toBeInTheDocument();
  });

  it("requires a title that is more than whitespace", async () => {
    const user = userEvent.setup();
    renderForm();
    const title = screen.getByLabelText("Habit Title");

    expect(screen.queryByText("Title is required")).not.toBeInTheDocument();

    await user.clear(title);
    expect(title).toHaveAccessibleDescription("Title is required");

    await user.type(title, "   ");
    expect(screen.getByText("Title is required")).toBeInTheDocument();

    await user.type(title, "Walk");
    expect(screen.queryByText("Title is required")).not.toBeInTheDocument();
  });
});
