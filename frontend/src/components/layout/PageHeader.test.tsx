import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PageHeader } from "./PageHeader";

describe("PageHeader", () => {
  it("renders the title as a single readable heading", () => {
    render(<PageHeader title="Welcome back, Andrea" />);

    const heading = screen.getByRole("heading", { level: 1 });
    expect(heading).toHaveTextContent("Welcome back, Andrea");

    // The title used to be split into one animated span per word, which
    // delayed the page's own heading behind a blur-in reveal.
    expect(heading.querySelectorAll("span").length).toBe(0);
  });

  it("renders the subtitle and children when provided", () => {
    render(
      <PageHeader title="Your Goals" subtitle="Tuesday, 12 August" hasChanges>
        <button type="button">Tab</button>
      </PageHeader>,
    );

    expect(screen.getByText("Tuesday, 12 August")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tab" })).toBeInTheDocument();
    expect(screen.getByText("Unsaved Changes")).toBeInTheDocument();
  });
});
