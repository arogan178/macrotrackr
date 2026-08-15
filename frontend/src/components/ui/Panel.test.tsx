import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { formStyles } from "@/components/form/FormStyles";
import Heading, { TYPE_SCALE } from "@/components/ui/Heading";
import Panel, { PANEL_CLASS } from "@/components/ui/Panel";
import { calculatorCardClass } from "@/features/landing/tools/calculatorStyles";

describe("Panel", () => {
  it("renders a title at the shared panel step", () => {
    render(<Panel title="Today">content</Panel>);

    const heading = screen.getByRole("heading", { level: 2, name: "Today" });
    for (const token of TYPE_SCALE.panel.split(" ")) {
      expect(heading).toHaveClass(token);
    }
  });

  it("omits the header row entirely when there is nothing to put in it", () => {
    const { container } = render(<Panel>content</Panel>);

    expect(container.querySelectorAll(".border-b-2")).toHaveLength(0);
  });

  it("separates the footer with a section rule rather than a nested box", () => {
    const { container } = render(<Panel footer={<span>Save</span>}>body</Panel>);

    // The heavier of the two rule weights: a footer is a major division, and
    // the grade is what says so before the content is read.
    const footer = screen.getByText("Save").parentElement;
    expect(footer).toHaveClass("border-t-2");
    expect(footer).toHaveClass("border-border-2");
    expect(container.querySelectorAll(".rounded-card")).toHaveLength(1);
  });

  it("casts no shadow — nothing is darker than the page", () => {
    expect(PANEL_CLASS).not.toContain("shadow");
    expect(PANEL_CLASS).not.toContain("backdrop-blur");
  });

  it("is the same object as the form card and the calculator card", () => {
    expect(formStyles.card.container).toBe(PANEL_CLASS);
    expect(calculatorCardClass.startsWith(PANEL_CLASS)).toBe(true);
  });
});

describe("Heading", () => {
  it("maps each step to a sensible element by default", () => {
    render(
      <>
        <Heading level="page">Page</Heading>
        <Heading level="panel">Panel</Heading>
      </>,
    );

    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Page");
    expect(screen.getByRole("heading", { level: 2 })).toHaveTextContent(
      "Panel",
    );
  });

  it("lets the element be chosen independently of the visual step", () => {
    render(
      <Heading level="page" as="h2">
        Still a page title
      </Heading>,
    );

    expect(screen.getByRole("heading", { level: 2 })).toHaveClass(
      "text-[1.75rem]",
    );
  });
});
