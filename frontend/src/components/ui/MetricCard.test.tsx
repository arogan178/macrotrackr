import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import MetricCard from "@/components/ui/MetricCard";

describe("MetricCard", () => {
  it("renders title, value, unit, and subtitle in default mode", () => {
    render(
      <MetricCard
        title="BMR"
        value={1835}
        unit="kcal"
        subtitle="at rest"
      />,
    );

    expect(screen.getByRole("heading", { name: "BMR" })).toBeInTheDocument();
    expect(screen.getByText("1,835")).toBeInTheDocument();
    expect(screen.getByText("kcal")).toBeInTheDocument();
    expect(screen.getByText("at rest")).toBeInTheDocument();
  });

  it("renders compact size without breaking layout", () => {
    render(
      <MetricCard
        title="TDEE"
        value={2202}
        unit="kcal"
        subtitle="with activity"
        size="compact"
      />,
    );

    expect(screen.getByRole("heading", { name: "TDEE" })).toBeInTheDocument();
    expect(screen.getByText("2,202")).toBeInTheDocument();
    expect(screen.getByText("kcal")).toBeInTheDocument();
    expect(screen.getByText("with activity")).toBeInTheDocument();
  });

  it("renders complete profile message when value is undefined", () => {
    render(<MetricCard title="BMR" />);

    expect(screen.getByText("Complete profile")).toBeInTheDocument();
  });
});
