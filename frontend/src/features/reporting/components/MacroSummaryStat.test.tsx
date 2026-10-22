import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MacroSummaryStats from "./MacroSummaryStat";

const day = (calories: number, protein: number) => ({
  name: "d",
  calories,
  protein,
  carbs: 200,
  fats: 60,
});

describe("MacroSummaryStats difference colours", () => {
  it.each([
    ["over target", 2600, 200],
    ["under target", 1400, 40],
  ])("uses no success or error colour when %s", (_label, calories, protein) => {
    const { container } = render(
      <MacroSummaryStats
        data={[day(calories, protein)]}
        calorieTarget={2000}
        averages={{ calories, protein, carbs: 200, fats: 60 }}
        trackedDays={1}
        totalDays={1}
      />,
    );

    expect(container.innerHTML).not.toMatch(/text-(success|error)/);
    expect(container.textContent).toMatch(/ (over|under)/);
  });
});
