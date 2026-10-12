import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import UserMetricsPanel from "./UserMetricsPanel";

describe("UserMetricsPanel", () => {
  it("labels the formula TDEE as with activity", () => {
    render(<UserMetricsPanel bmr={1760} tdee={2728} />);

    expect(screen.getAllByText("TDEE").length).toBeGreaterThan(0);
    expect(screen.getByText("with activity")).toBeInTheDocument();
    expect(screen.queryByText("Your TDEE")).not.toBeInTheDocument();
  });

  it("labels the user's own maintenance as Your TDEE", () => {
    render(<UserMetricsPanel bmr={1760} tdee={2500} tdeeIsOverride />);

    expect(screen.getAllByText("Your TDEE").length).toBeGreaterThan(0);
    expect(screen.getByText("set by you")).toBeInTheDocument();
    expect(screen.queryByText("with activity")).not.toBeInTheDocument();
  });
});
