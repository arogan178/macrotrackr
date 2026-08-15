import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import Accordion from "@/components/ui/Accordion";

const items = [
  { id: "a", question: "First question", answer: "First answer" },
  { id: "b", question: "Second question", answer: "Second answer" },
];

describe("Accordion", () => {
  it("starts closed", () => {
    render(<Accordion items={items} />);
    expect(screen.getByText("First question").closest("details")).not.toHaveAttribute("open");
  });

  it("opens on click and animates rather than snapping", () => {
    render(<Accordion items={items} />);
    const summary = screen.getByText("First question").closest("summary")!;

    fireEvent.click(summary);

    const details = summary.closest("details")!;
    expect(details).toHaveAttribute("open");
    // The animated wrapper is what makes this cross-browser; ::details-content
    // would have left Firefox and Safari snapping.
    const grid = details.querySelector<HTMLElement>('[style*="grid-template-rows"]')!;
    expect(grid.style.gridTemplateRows).toBe("1fr");
  });

  it("keeps the element open until the collapse finishes", () => {
    render(<Accordion items={items} />);
    const summary = screen.getByText("First question").closest("summary")!;
    fireEvent.click(summary);
    const details = summary.closest("details")!;

    fireEvent.click(summary);
    const grid = details.querySelector<HTMLElement>('[style*="grid-template-rows"]')!;
    expect(grid.style.gridTemplateRows).toBe("0fr");
    expect(details).toHaveAttribute("open"); // still open, still collapsing

    fireEvent.transitionEnd(grid);
    expect(details).not.toHaveAttribute("open");
  });

  it("opens the first item when asked", () => {
    render(<Accordion items={items} defaultOpenFirst />);
    expect(screen.getByText("First question").closest("details")).toHaveAttribute("open");
    expect(screen.getByText("Second question").closest("details")).not.toHaveAttribute("open");
  });
});
