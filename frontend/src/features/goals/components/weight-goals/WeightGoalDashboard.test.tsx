import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useStore } from "@/store/store";
import type { UserSettings } from "@/types/user";

import WeightGoalDashboard from "./WeightGoalDashboard";

describe("WeightGoalDashboard", () => {
  beforeEach(() => {
    useStore.setState({ isLogWeightModalOpen: false });
  });

  it("offers logging a weight before a weight goal exists", async () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <WeightGoalDashboard
          user={{ weight: 80 } as UserSettings}
          tdee={2200}
          macroDailyTotals={{ calories: 0, protein: 0, carbs: 0, fats: 0 }}
          weightGoals={undefined}
          onOpenModal={vi.fn()}
          onDelete={vi.fn()}
        />
      </QueryClientProvider>,
    );

    await userEvent.click(screen.getByRole("button", { name: "Log Weight" }));

    expect(useStore.getState().isLogWeightModalOpen).toBe(true);
  });
});
