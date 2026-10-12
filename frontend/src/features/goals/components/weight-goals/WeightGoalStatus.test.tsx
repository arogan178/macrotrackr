import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import WeightGoalStatus from "./WeightGoalStatus";

describe("WeightGoalStatus", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <WeightGoalStatus
        startingWeight={80}
        targetWeight={75}
        tdee={2200}
        macroDailyTotals={{ calories: 1800, protein: 120, carbs: 200, fats: 60 }}
        weightGoals={undefined}
        onEdit={() => {}}
        onDelete={() => {}}
        onLogWeight={() => {}}
      />,
    );
    expect(container).toBeDefined();
  });

  it("shows the trend weight and its change over 7 days", () => {
    render(
      <WeightGoalStatus
        startingWeight={80}
        targetWeight={75}
        tdee={2200}
        macroDailyTotals={{ calories: 1800, protein: 120, carbs: 200, fats: 60 }}
        weightGoals={undefined}
        onEdit={() => {}}
        onDelete={() => {}}
        onLogWeight={() => {}}
        trendWeight={79.34}
        trendChange={-0.62}
      />,
    );

    expect(screen.getByText("79.3 kg")).toBeInTheDocument();
    expect(screen.getByText("Down 0.6 kg in 7 days")).toBeInTheDocument();
  });
});
