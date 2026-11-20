import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MobileTabBar from "./MobileTabBar";

let pathname = "/home";

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname }),
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: React.ReactNode;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

describe("MobileTabBar", () => {
  beforeEach(() => {
    pathname = "/home";
  });

  it("puts all four destinations within thumb reach", () => {
    render(<MobileTabBar onLog={vi.fn()} />);

    for (const label of ["Home", "Goals", "Analytics", "Settings"]) {
      expect(screen.getByRole("link", { name: label })).toBeInTheDocument();
    }
  });

  it("gives the primary action its own control rather than a scroll", async () => {
    const onLog = vi.fn();
    render(<MobileTabBar onLog={onLog} />);

    await userEvent.click(screen.getByRole("button", { name: "Log a meal" }));

    expect(onLog).toHaveBeenCalledOnce();
  });

  it("marks exactly one destination as current", () => {
    pathname = "/reporting";
    render(<MobileTabBar onLog={vi.fn()} />);

    const current = screen.getAllByRole("link", { current: "page" });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Analytics");
  });

  it("links to the chosen destination", () => {
    render(<MobileTabBar onLog={vi.fn()} />);

    expect(screen.getByRole("link", { name: "Goals" })).toHaveAttribute(
      "href",
      "/goals",
    );
  });

  it("opens the sheet in place, without navigating away", async () => {
    pathname = "/goals";
    const onLog = vi.fn();
    render(<MobileTabBar onLog={onLog} />);

    await userEvent.click(screen.getByRole("button", { name: "Log a meal" }));

    expect(onLog).toHaveBeenCalledTimes(1);
  });

  it("clears the home indicator", () => {
    render(<MobileTabBar onLog={vi.fn()} />);

    expect(screen.getByRole("navigation", { name: "Primary" })).toHaveClass(
      "pb-[var(--sab)]",
    );
  });
});
