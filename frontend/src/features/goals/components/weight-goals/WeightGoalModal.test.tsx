import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

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

function renderModal(unitSystem: "metric" | "imperial" = "metric") {
  const onClose = vi.fn();
  render(
    <WeightGoalModal
      isOpen
      onClose={onClose}
      startingWeight={80}
      tdee={2500}
      weightGoals={null}
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

    const target = await screen.findByLabelText("Target Weight");
    await user.clear(target);
    await user.type(target, "75");
    await user.click(screen.getByRole("button", { name: "Set Goal" }));

    expect(createGoal).toHaveBeenCalledWith({
      tdee: 2500,
      goals: expect.objectContaining({
        startingWeight: 80,
        targetWeight: 75,
        startDate: "2026-10-04",
        weightGoal: "lose",
        calorieTarget: 2000,
        dailyChange: -500,
      }),
    });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("explains an out-of-range or missing target and blocks saving", async () => {
    const user = userEvent.setup();
    renderModal();
    const target = await screen.findByLabelText("Target Weight");
    const save = screen.getByRole("button", { name: "Set Goal" });

    await user.clear(target);
    expect(
      screen.getByText("Target weight is required"),
    ).toBeInTheDocument();
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
    const target = await screen.findByLabelText("Target Weight");

    await user.clear(target);
    await user.type(target, "50");

    expect(
      screen.getByText("Target weight must be at least 67 lb"),
    ).toBeInTheDocument();
  });
});
