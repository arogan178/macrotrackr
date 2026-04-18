import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import type { HabitGoalFormValues } from "@/types/habit";

import HabitForm from "./HabitForm";

const baseValues: HabitGoalFormValues = {
  title: "Drink Water",
  iconName: "target",
  target: 10,
  accentColor: "indigo",
};

describe("HabitForm", () => {
  it("renders form fields, preview, and hidden progress inputs", () => {
    const onChange = vi.fn();

    const { container } = render(
      <HabitForm
        values={baseValues}
        onChange={onChange}
        errors={{}}
        currentProgress={7}
      />,
    );

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

  it("propagates title changes through onChange", () => {
    const onChange = vi.fn();

    render(<HabitForm values={baseValues} onChange={onChange} errors={{}} />);

    fireEvent.change(screen.getByLabelText("Habit Title"), {
      target: { value: "Read 20 pages" },
    });

    expect(onChange).toHaveBeenCalledWith("title", "Read 20 pages");
  });

  it("clamps target values to at least 1", () => {
    const onChange = vi.fn();

    render(<HabitForm values={baseValues} onChange={onChange} errors={{}} />);

    fireEvent.change(screen.getByLabelText("Target"), {
      target: { value: "0" },
    });

    expect(onChange).toHaveBeenCalledWith("target", 1);

    fireEvent.change(screen.getByLabelText("Target"), {
      target: { value: "22" },
    });

    expect(onChange).toHaveBeenCalledWith("target", 22);
  });

  it("updates selected icon and color via button groups", () => {
    const onChange = vi.fn();

    render(<HabitForm values={baseValues} onChange={onChange} errors={{}} />);

    fireEvent.click(screen.getByRole("button", { name: "Calendar icon" }));
    fireEvent.click(screen.getByRole("button", { name: "Select Red color" }));

    expect(onChange).toHaveBeenCalledWith("iconName", "calendar");
    expect(onChange).toHaveBeenCalledWith("accentColor", "red");
  });

  it("shows validation errors passed from parent", () => {
    const onChange = vi.fn();

    render(
      <HabitForm
        values={baseValues}
        onChange={onChange}
        errors={{
          title: "Title is required",
          target: "Target must be greater than 0",
        }}
      />,
    );

    expect(screen.getByText("Title is required")).toBeInTheDocument();
    expect(
      screen.getByText("Target must be greater than 0"),
    ).toBeInTheDocument();
  });
});
