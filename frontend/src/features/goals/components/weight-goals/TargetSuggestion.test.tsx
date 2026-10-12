import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import TargetSuggestion from "./TargetSuggestion";

describe("TargetSuggestion", () => {
  it("shows the working and wires the three actions", async () => {
    const onUse = vi.fn();
    const onEdit = vi.fn();
    const onDismiss = vi.fn();
    render(
      <TargetSuggestion
        suggestion={{
          target: 1910,
          measured: 2350,
          change: -440,
          weightGoal: "lose",
          ratePercent: 0.5,
          currentTarget: 2240,
        }}
        isSaving={false}
        onUse={onUse}
        onEdit={onEdit}
        onDismiss={onDismiss}
      />,
    );

    expect(
      screen.getByText(
        "Suggested target 1,910 kcal: measured 2,350 minus 440 for losing 0.5% a week. Your current target is 2,240.",
      ),
    ).toBeInTheDocument();

    await userEvent.click(screen.getByRole("button", { name: "Use 1,910" }));
    await userEvent.click(screen.getByRole("button", { name: "Edit" }));
    await userEvent.click(screen.getByRole("button", { name: "Not now" }));

    expect(onUse).toHaveBeenCalledOnce();
    expect(onEdit).toHaveBeenCalledOnce();
    expect(onDismiss).toHaveBeenCalledOnce();
  });
});
