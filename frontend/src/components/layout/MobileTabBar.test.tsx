import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MobileTabBar from "./MobileTabBar";

let pathname = "/home";
const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname }),
  useNavigate: () => navigateMock,
}));

describe("MobileTabBar", () => {
  beforeEach(() => {
    pathname = "/home";
    navigateMock.mockReset();
  });

  it("puts all four destinations within thumb reach", () => {
    render(<MobileTabBar onLog={vi.fn()} />);

    for (const label of ["Home", "Goals", "Analytics", "Settings"]) {
      expect(screen.getByRole("button", { name: label })).toBeInTheDocument();
    }
  });

  it("gives the primary action its own control rather than a scroll", async () => {
    const onLog = vi.fn();
    render(<MobileTabBar onLog={onLog} />);

    await userEvent.click(screen.getByRole("button", { name: "Log a meal" }));

    expect(onLog).toHaveBeenCalledOnce();
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("marks exactly one destination as current", () => {
    pathname = "/reporting";
    render(<MobileTabBar onLog={vi.fn()} />);

    const current = screen.getAllByRole("button", { current: "page" });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Analytics");
  });

  it("navigates to the chosen destination", async () => {
    render(<MobileTabBar onLog={vi.fn()} />);

    await userEvent.click(screen.getByRole("button", { name: "Goals" }));

    expect(navigateMock).toHaveBeenCalledWith({ to: "/goals" });
  });

  it("clears the home indicator", () => {
    render(<MobileTabBar onLog={vi.fn()} />);

    expect(screen.getByRole("navigation", { name: "Primary" })).toHaveClass(
      "pb-[var(--sab)]",
    );
  });
});
