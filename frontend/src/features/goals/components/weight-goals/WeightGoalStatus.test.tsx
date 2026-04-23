import { render } from "@testing-library/react";
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
});
