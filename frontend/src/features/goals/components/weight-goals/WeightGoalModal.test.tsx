import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { WeightGoals } from "@/types/goal";

import WeightGoalModal from "./WeightGoalModal";

const createGoal = vi.hoisted(() => vi.fn());
const updateGoal = vi.hoisted(() => vi.fn());
vi.mock("@/hooks/queries/useGoals", () => ({
  useCreateWeightGoal: () => ({ mutateAsync: createGoal, isPending: false }),
  useUpdateWeightGoal: () => ({ mutateAsync: updateGoal, isPending: false }),
}));
vi.mock("@/store/store", () => ({
  useStore: () => ({ showNotification: vi.fn() }),
}));
vi.mock("@/utils/dateUtilities", async (importOriginal) => ({
  ...(await importOriginal<object>()),
  todayISO: () => "2026-10-04",
}));

function renderModal(
  unitSystem: "metric" | "imperial" = "metric",
  weightGoals: WeightGoals | null = null,
) {
  const onClose = vi.fn();
  render(
    <WeightGoalModal
      isOpen
      onClose={onClose}
      startingWeight={80}
      tdee={2500}
      weightGoals={weightGoals}
      unitSystem={unitSystem}
    />,
  );

  return { onClose };
}

describe("WeightGoalModal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    if (!document.querySelector("#modal-root")) {
      const modalRoot = document.createElement("div");
      modalRoot.setAttribute("id", "modal-root");
      document.body.append(modalRoot);
    }
  });

  it("creates a weight-loss goal from the typed target", async () => {
    const user = userEvent.setup();
    createGoal.mockResolvedValue(undefined);
    const { onClose } = renderModal();

    const target = await screen.findByLabelText("Target weight");
    await user.clear(target);
    await user.type(target, "75");
    await user.click(screen.getByRole("button", { name: "Set goal" }));

    expect(createGoal).toHaveBeenCalledWith({
      tdee: 2500,
      goals: expect.objectContaining({
        startingWeight: 80,
        targetWeight: 75,
        startDate: "2026-10-04",
        weightGoal: "lose",
        calorieTarget: 2060,
        dailyChange: -440,
        weeklyChange: -0.4,
        calculatedWeeks: 13,
      }),
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("shows the maths for the chosen rate and saves the new target", async () => {
    const user = userEvent.setup();
    createGoal.mockResolvedValue(undefined);
    renderModal();

    const target = await screen.findByLabelText("Target weight");
    await user.clear(target);
    await user.type(target, "75");

    expect(
      screen.getByText(
        "0.5% a week is 0.4 kg, about 440 kcal a day below your 2,500 kcal maintenance.",
      ),
    ).toBeInTheDocument();
    expect(screen.getByText("Recommended 0.5% to 1.0%")).toBeInTheDocument();

    fireEvent.change(screen.getByRole("slider"), { target: { value: "1" } });
    expect(
      screen.getByText(
        "1.0% a week is 0.8 kg, about 880 kcal a day below your 2,500 kcal maintenance.",
      ),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Set goal" }));
    expect(createGoal).toHaveBeenCalledWith(
      expect.objectContaining({
        goals: expect.objectContaining({
          calorieTarget: 1620,
          dailyChange: -880,
          weeklyChange: -0.8,
        }),
      }),
    );
  });

  it("states a gain rate in pounds for imperial users", async () => {
    const user = userEvent.setup();
    renderModal("imperial");

    const target = await screen.findByLabelText("Target weight");
    await user.clear(target);
    await user.type(target, "185");

    expect(
      screen.getByText(
        "0.25% a week is 0.4 lb, about 220 kcal a day above your 2,500 kcal maintenance.",
      ),
    ).toBeInTheDocument();
  });

  it("keeps a saved custom target until the rate changes", async () => {
    const user = userEvent.setup();
    updateGoal.mockResolvedValue(undefined);
    renderModal("metric", {
      startingWeight: 90,
      currentWeight: 80,
      targetWeight: 70,
      weightGoal: "lose",
      startDate: "2026-09-01",
      targetDate: "2027-03-01",
      calorieTarget: 1900,
      calculatedWeeks: 26,
      weeklyChange: 0.6,
      dailyChange: -600,
    });

    // 0.6 kg of 80 kg reads back as 0.75% a week
    expect(
      await screen.findByText(
        "0.75% a week is 0.6 kg, about 660 kcal a day below your 2,500 kcal maintenance.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Daily calorie target: 1,900 kcal"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update goal" })).toBeDisabled();

    fireEvent.change(screen.getByRole("slider"), { target: { value: "0.5" } });
    expect(
      screen.getByText("Daily calorie target: 2,060 kcal"),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Update goal" }));
    expect(updateGoal).toHaveBeenCalledWith(
      expect.objectContaining({
        goals: expect.objectContaining({
          calorieTarget: 2060,
          dailyChange: -440,
          weeklyChange: -0.4,
        }),
      }),
    );
  });

  it("explains an out-of-range or missing target and blocks saving", async () => {
    const user = userEvent.setup();
    renderModal();
    const target = await screen.findByLabelText("Target weight");
    const save = screen.getByRole("button", { name: "Set goal" });

    await user.clear(target);
    expect(screen.getByText("Target weight is required")).toBeInTheDocument();
    expect(save).toBeDisabled();

    await user.type(target, "20");
    expect(
      screen.getByText("Target weight must be at least 30 kg"),
    ).toBeInTheDocument();
    expect(target).toHaveAttribute("aria-invalid", "true");
    expect(save).toBeDisabled();

    await user.clear(target);
    await user.type(target, "70");
    expect(screen.queryByText(/Target weight must/)).not.toBeInTheDocument();
    expect(save).toBeEnabled();
  });

  it("states the limits in pounds for imperial users", async () => {
    const user = userEvent.setup();
    renderModal("imperial");
    const target = await screen.findByLabelText("Target weight");

    await user.clear(target);
    await user.type(target, "50");

    expect(
      screen.getByText("Target weight must be at least 67 lb"),
    ).toBeInTheDocument();
  });
});
