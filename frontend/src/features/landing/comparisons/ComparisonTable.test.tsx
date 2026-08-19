import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ComparisonTable from "./ComparisonTable";

const columns = [
  { key: "feature", label: "Feature" },
  { key: "macrotrackr", label: "MacroTrackr", isOwn: true },
  { key: "rival", label: "Rival" },
];

const rows = [
  {
    feature: "Barcode scanner",
    values: { macrotrackr: "Free", rival: "Paywalled" },
  },
  { feature: "Ads", values: { macrotrackr: "None", rival: "Frequent" } },
];

describe("ComparisonTable", () => {
  it("prints each cell as written", () => {
    render(<ComparisonTable caption="Features" columns={columns} rows={rows} />);

    expect(screen.getByText("Free")).toBeInTheDocument();
    expect(screen.getByText("Paywalled")).toBeInTheDocument();
    expect(screen.getByText("Frequent")).toBeInTheDocument();
  });

  it("draws no verdict icons", () => {
    // Both tables used to stamp a green tick on every MacroTrackr cell and pick
    // a tick or cross for the competitor by substring-matching its text. The
    // cell is the claim; the icon was editorial.
    const { container } = render(
      <ComparisonTable caption="Features" columns={columns} rows={rows} />,
    );

    expect(container.querySelectorAll("svg")).toHaveLength(0);
  });

  it("names the table from its heading without repeating the text", () => {
    render(<ComparisonTable caption="Features" columns={columns} rows={rows} />);

    const heading = screen.getByRole("heading", { name: "Features" });
    expect(screen.getByRole("table")).toHaveAccessibleName("Features");
    expect(screen.getAllByText("Features")).toHaveLength(1);
    expect(heading).toBeInTheDocument();
  });

  it("marks the feature column as a row header", () => {
    render(<ComparisonTable caption="Features" columns={columns} rows={rows} />);

    expect(
      screen.getByRole("rowheader", { name: "Barcode scanner" }),
    ).toBeInTheDocument();
  });

  it("falls back to a dash for a missing value rather than an empty cell", () => {
    render(
      <ComparisonTable
        caption="Features"
        columns={columns}
        rows={[{ feature: "Widgets", values: { macrotrackr: "Yes" } }]}
      />,
    );

    expect(screen.getByText("—")).toBeInTheDocument();
  });

  it("sets the product column apart by colour, not weight", () => {
    render(<ComparisonTable caption="Features" columns={columns} rows={rows} />);

    expect(screen.getByText("Free").className).toContain("text-primary");
    expect(screen.getByText("Free").className).not.toContain("font-bold");
  });
});
