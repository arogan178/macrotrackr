import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import Accordion from "./Accordion";
import Skeleton from "./Skeleton";
import StateCard from "./StateCard";

describe("StateCard", () => {
  it("names the action rather than the absence", async () => {
    const onClick = vi.fn();
    render(
      <StateCard
        title="No meals logged yet"
        message="Log your first meal to see the day."
        action={{ label: "Log a meal", onClick }}
      />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Log a meal" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("announces the error tone to assistive tech", () => {
    render(<StateCard tone="error" title="Couldn't load" message="Try again." />);

    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("does not announce an empty state as an error", () => {
    render(<StateCard title="Nothing here" message="Add something." />);

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("renders both actions when given two", () => {
    render(
      <StateCard
        tone="error"
        title="Couldn't load"
        message="Try again."
        action={{ label: "Try again", onClick: vi.fn() }}
        secondaryAction={{ label: "Reload page", onClick: vi.fn() }}
      />,
    );

    expect(screen.getByRole("button", { name: "Try again" })).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Reload page" }),
    ).toBeInTheDocument();
  });
});

describe("Skeleton", () => {
  it("is hidden from assistive tech", () => {
    const { container } = render(<Skeleton className="h-4 w-20" />);

    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("renders the requested number of lines, tapering the last", () => {
    const { container } = render(<Skeleton lines={3} />);

    const lines = container.querySelectorAll(".animate-pulse");
    expect(lines).toHaveLength(3);
    expect(lines[2]).toHaveClass("w-2/3");
  });
});

describe("Accordion", () => {
  const items = [
    { id: "a", question: "First question", answer: "First answer" },
    { id: "b", question: "Second question", answer: "Second answer" },
  ];

  it("uses native disclosure so it works without JavaScript", () => {
    const { container } = render(<Accordion items={items} />);

    expect(container.querySelectorAll("details")).toHaveLength(2);
    expect(container.querySelectorAll("summary")).toHaveLength(2);
  });

  it("opens only the first item when asked", () => {
    const { container } = render(<Accordion items={items} defaultOpenFirst />);

    const [first, second] = container.querySelectorAll("details");
    expect(first).toHaveAttribute("open");
    expect(second).not.toHaveAttribute("open");
  });
});
