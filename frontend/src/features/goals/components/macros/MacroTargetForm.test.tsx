import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MacroTargetForm from "./MacroTargetForm";

const mutateAsync = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/queries", () => ({
  useUpdateMacroTarget: () => ({ mutateAsync, isPending: false }),
}));

const saved = { proteinPercentage: 30, carbsPercentage: 40, fatsPercentage: 30 };

function sliderValues() {
  return screen
    .getAllByRole("slider")
    .map((slider) => (slider as HTMLInputElement).value);
}

describe("MacroTargetForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("saves the adjusted split and clears the unsaved state", async () => {
    const user = userEvent.setup();
    mutateAsync.mockResolvedValue(undefined);
    render(<MacroTargetForm macroTarget={saved} />);
    const save = screen.getByRole("button", { name: "Save macro targets" });

    expect(save).toBeDisabled();
    fireEvent.change(screen.getAllByRole("slider")[0], {
      target: { value: "40" },
    });
    expect(screen.getByText("You have unsaved changes")).toBeInTheDocument();

    await user.click(save);

    expect(mutateAsync).toHaveBeenCalledWith({
      proteinPercentage: 40,
      carbsPercentage: 34,
      fatsPercentage: 26,
      lockedMacros: undefined,
    });
    expect(
      await screen.findByText("Settings saved successfully"),
    ).toBeInTheDocument();
    expect(save).toBeDisabled();
  });

  it("puts the sliders back to the saved split on reset", async () => {
    const user = userEvent.setup();
    render(<MacroTargetForm macroTarget={saved} />);

    fireEvent.change(screen.getAllByRole("slider")[0], {
      target: { value: "40" },
    });
    expect(sliderValues()).toEqual(["40", "34", "26"]);

    await user.click(screen.getByRole("button", { name: "Reset macro targets" }));

    expect(sliderValues()).toEqual(["30", "40", "30"]);
    expect(
      screen.queryByText("You have unsaved changes"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Save macro targets" }),
    ).toBeDisabled();
  });
});
