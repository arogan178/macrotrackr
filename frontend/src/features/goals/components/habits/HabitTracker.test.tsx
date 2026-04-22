import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import type { HabitGoal } from "@/types/habit";

import HabitTracker from "./HabitTracker";

let authMode: "clerk" | "local" = "clerk";

vi.mock("@/config/runtime", () => ({
  get isLocalAuthMode() {
    return authMode === "local";
  },
}));

vi.mock("@/hooks/useSubscriptionStatus", () => ({
  useSubscriptionStatus: () => ({
    subscriptionStatus: "free",
    setSubscriptionStatus: vi.fn(),
  }),
}));

describe("HabitTracker", () => {
  const baseHabit: HabitGoal = {
    id: "h1",
    title: "Hydrate",
    iconName: "droplet",
    current: 0,
    target: 1,
    progress: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
  };

  beforeEach(() => {
    authMode = "clerk";
  });

  it("allows add button in self-hosted mode", () => {
    authMode = "local";

    const { getByRole } = render(
      <HabitTracker
        habits={[baseHabit]}
        onAddHabit={() => undefined}
      />,
    );

    expect(getByRole("button", { name: /add habit/i })).toBeInTheDocument();
  });

  it("renders without crashing", () => {
    const { container } = render(<HabitTracker habits={[]} />);
    expect(container).toBeDefined();
  });
});
