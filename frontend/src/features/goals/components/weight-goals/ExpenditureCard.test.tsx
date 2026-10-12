import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ExpenditureCard from "./ExpenditureCard";

describe("ExpenditureCard", () => {
  it("shows the measured figure beside the formula, with its working", () => {
    render(
      <ExpenditureCard
        expenditure={{
          status: "measured",
          estimate: 2527,
          avgIntake: 2176.4,
          usableDays: 18,
          windowDays: 21,
          trendStartKg: 80.3,
          trendEndKg: 79.4,
          spanDays: 20,
          dailyBalance: -350.6,
        }}
        formulaTdee={2787}
        unitSystem="metric"
      />,
    );

    expect(screen.getByText("Measured expenditure")).toBeInTheDocument();
    expect(screen.getByText("2,530")).toBeInTheDocument();
    expect(screen.getByText("Formula estimate")).toBeInTheDocument();
    expect(screen.getByText("2,790")).toBeInTheDocument();
    expect(
      screen.getByText("You averaged 2,180 kcal on 18 fully logged days."),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your trend fell 0.9 kg in 20 days, about 350 kcal a day. 2,180 + 350 = 2,530.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Days marked as partly logged are left out\./),
    ).toBeInTheDocument();
  });

  it("reads naturally when the trend is rising, in pounds", () => {
    render(
      <ExpenditureCard
        expenditure={{
          status: "measured",
          estimate: 2508,
          avgIntake: 2700,
          usableDays: 15,
          windowDays: 21,
          trendStartKg: 70,
          trendEndKg: 70.5,
          spanDays: 20,
          dailyBalance: 192.5,
        }}
        formulaTdee={2600}
        unitSystem="imperial"
      />,
    );

    expect(screen.getByText("2,510")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Your trend rose 1.1 lb in 20 days, about 190 kcal a day stored. 2,700 - 190 = 2,510.",
      ),
    ).toBeInTheDocument();
  });

  it("says what is missing and keeps the formula estimate", () => {
    render(
      <ExpenditureCard
        expenditure={{
          status: "insufficient",
          usableDays: 8,
          weighInsInWindow: 1,
          needs: { loggedDays: 6, weighIns: 2 },
        }}
        formulaTdee={2787}
        unitSystem="metric"
      />,
    );

    expect(screen.queryByText("Measured expenditure")).not.toBeInTheDocument();
    expect(screen.getByText("2,790")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Measured expenditure needs 6 more fully logged days and 2 more weigh-ins in the last 3 weeks.",
      ),
    ).toBeInTheDocument();
  });

  it("asks for one more weigh-in in the singular", () => {
    render(
      <ExpenditureCard
        expenditure={{
          status: "insufficient",
          usableDays: 20,
          weighInsInWindow: 2,
          needs: { loggedDays: 0, weighIns: 1 },
        }}
        formulaTdee={0}
        unitSystem="metric"
      />,
    );

    expect(screen.queryByText("Formula estimate")).not.toBeInTheDocument();
    expect(
      screen.getByText(
        "Measured expenditure needs 1 more weigh-in in the last 3 weeks.",
      ),
    ).toBeInTheDocument();
  });

  it("explains a trend that does not yet span two weeks", () => {
    render(
      <ExpenditureCard
        expenditure={{
          status: "insufficient",
          usableDays: 20,
          weighInsInWindow: 4,
          needs: { loggedDays: 0, weighIns: 0 },
        }}
        formulaTdee={2787}
        unitSystem="metric"
      />,
    );

    expect(
      screen.getByText(
        "Measured expenditure needs weigh-ins spread over at least 2 of the last 3 weeks.",
      ),
    ).toBeInTheDocument();
  });
});
