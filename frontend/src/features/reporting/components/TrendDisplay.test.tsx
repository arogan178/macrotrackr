import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import TrendDisplay from "./TrendDisplay";

describe("TrendDisplay colours", () => {
  it.each([5, -5])("shows a %i delta in a neutral colour", (delta) => {
    const { container } = render(
      <TrendDisplay
        label="Calories"
        icon={<span />}
        trend={{
          direction: delta > 0 ? "up" : "down",
          percentage: 5,
          message: "m",
          firstAvg: 100,
          lastAvg: 105,
          delta,
          unit: "cal",
        }}
        data={[]}
      />,
    );

    expect(container.innerHTML).not.toMatch(/text-(success|error)/);
    expect(
      container.querySelector("span.text-foreground.font-medium"),
    ).not.toBeNull();
  });
});
