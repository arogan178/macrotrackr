import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PartialDayControls from "./PartialDayControls";

const api = vi.hoisted(() => ({
  partialDates: [] as string[],
  getPartialDays: vi.fn(),
  setPartialDay: vi.fn(),
}));

vi.mock("@/api/macros", () => ({
  macrosApi: {
    getPartialDays: api.getPartialDays,
    setPartialDay: api.setPartialDay,
  },
}));

const target = {
  proteinPercentage: 30,
  carbsPercentage: 40,
  fatsPercentage: 30,
};

function renderControls() {
  const onEstimate = vi.fn().mockResolvedValue(undefined);
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <PartialDayControls
        date="2026-10-10"
        macroTarget={target}
        onEstimate={onEstimate}
      />
    </QueryClientProvider>,
  );

  return onEstimate;
}

describe("PartialDayControls", () => {
  beforeEach(() => {
    if (!document.querySelector("#modal-root")) {
      const modalRoot = document.createElement("div");
      modalRoot.setAttribute("id", "modal-root");
      document.body.appendChild(modalRoot);
    }
    api.partialDates = [];
    api.getPartialDays.mockImplementation(async () => ({
      dates: [...api.partialDates],
    }));
    api.setPartialDay.mockImplementation(
      async (date: string, partial: boolean) => {
        api.partialDates = partial ? [date] : [];

        return { date, partial };
      },
    );
  });

  it("logs 600 kcal as 45 g protein, 60 g carbs and 20 g fats", async () => {
    const user = userEvent.setup();
    const onEstimate = renderControls();

    await user.click(screen.getByRole("button", { name: "Estimate the rest" }));
    await user.type(screen.getByLabelText(/Calories not logged/), "600");

    expect(
      screen.getByText(
        "Adds 45 g protein, 60 g carbs, 20 g fats as a snack named Estimate.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Add estimate" }));

    expect(onEstimate).toHaveBeenCalledWith(
      expect.objectContaining({
        protein: 45,
        carbs: 60,
        fats: 20,
        mealType: "snack",
        mealName: "Estimate",
        entryDate: "2026-10-10",
      }),
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Add estimate" }),
      ).not.toBeInTheDocument(),
    );
  });

  it("will not add an estimate without a calorie figure", async () => {
    const user = userEvent.setup();
    renderControls();

    await user.click(screen.getByRole("button", { name: "Estimate the rest" }));

    expect(screen.getByRole("button", { name: "Add estimate" })).toBeDisabled();
  });

  it("marks the day as partly logged and clears it again", async () => {
    const user = userEvent.setup();
    renderControls();
    const toggle = screen.getByRole("checkbox", { name: "Partly logged" });
    await waitFor(() =>
      expect(api.getPartialDays).toHaveBeenCalledWith(
        "2026-10-10",
        "2026-10-10",
      ),
    );
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    expect(api.setPartialDay).toHaveBeenCalledWith("2026-10-10", true);
    await waitFor(() => expect(toggle).toBeChecked());

    await user.click(toggle);
    expect(api.setPartialDay).toHaveBeenLastCalledWith("2026-10-10", false);
    await waitFor(() => expect(toggle).not.toBeChecked());
  });

  it("shows the day as partly logged when the server says so", async () => {
    api.partialDates = ["2026-10-10"];
    renderControls();

    await waitFor(() =>
      expect(
        screen.getByRole("checkbox", { name: "Partly logged" }),
      ).toBeChecked(),
    );
  });

  it("rolls the toggle back when the server refuses", async () => {
    const user = userEvent.setup();
    api.setPartialDay.mockRejectedValue(new Error("Forbidden"));
    renderControls();
    const toggle = screen.getByRole("checkbox", { name: "Partly logged" });
    await waitFor(() => expect(api.getPartialDays).toHaveBeenCalled());

    await user.click(toggle);

    await waitFor(() => expect(api.setPartialDay).toHaveBeenCalled());
    await waitFor(() => expect(toggle).not.toBeChecked());
  });
});
