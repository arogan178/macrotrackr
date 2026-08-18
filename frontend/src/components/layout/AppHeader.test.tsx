import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AppHeader from "./AppHeader";

let pathname = "/home";
const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname }),
  useNavigate: () => navigateMock,
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

describe("AppHeader", () => {
  beforeEach(() => {
    pathname = "/home";
    navigateMock.mockReset();
  });

  it("renders exactly one navigation landmark per mode", () => {
    for (const mode of ["app", "public", "minimal"] as const) {
      const { unmount } = render(<AppHeader mode={mode} />);
      expect(screen.getAllByRole("navigation")).toHaveLength(1);
      unmount();
    }
  });

  it("carries the signed-in destinations in app mode", () => {
    render(<AppHeader mode="app" />);

    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    for (const label of ["Home", "Goals", "Analytics", "Settings"]) {
      expect(within(nav).getByText(label)).toBeInTheDocument();
    }
  });

  it("marks the current app route as the current page", () => {
    pathname = "/goals";
    render(<AppHeader mode="app" />);

    const current = screen.getAllByRole("button", { current: "page" });
    expect(current).toHaveLength(1);
    expect(current[0]).toHaveTextContent("Goals");
  });

  it("navigates when an app route button is clicked", async () => {
    render(<AppHeader mode="app" />);

    const nav = screen.getByRole("navigation", { name: "Main navigation" });
    await userEvent.click(within(nav).getByText("Analytics"));

    expect(navigateMock).toHaveBeenCalledWith({ to: "/reporting" });
  });

  it("carries the public destinations in public mode", () => {
    pathname = "/";
    render(<AppHeader mode="public" />);

    const nav = screen.getByRole("navigation", { name: "Site navigation" });
    for (const label of ["Tools", "Blog", "Pricing", "Docs", "GitHub"]) {
      expect(within(nav).getByText(label)).toBeInTheDocument();
    }
    expect(within(nav).getByText("Start free")).toBeInTheDocument();
  });

  it("gives public pages a mobile route to tools, blog and docs", async () => {
    pathname = "/";
    render(<AppHeader mode="public" />);

    await userEvent.click(screen.getByRole("button", { name: "Open menu" }));

    const sheet = screen.getByRole("dialog", { name: "Site navigation" });
    for (const label of [
      "Calculators",
      "Blog",
      "Pricing",
      "Docs",
      "GitHub",
      "Log in",
      "Start free",
    ]) {
      expect(within(sheet).getByText(label)).toBeInTheDocument();
    }
  });

  it("has no menu button in app mode because MobileTabBar handles mobile navigation", () => {
    render(<AppHeader mode="app" />);

    expect(
      screen.queryByRole("button", { name: "Open menu" }),
    ).not.toBeInTheDocument();
  });

  it("has no menu button in minimal mode", () => {
    render(<AppHeader mode="minimal" />);

    expect(
      screen.queryByRole("button", { name: "Open menu" }),
    ).not.toBeInTheDocument();
    expect(screen.getByText("Back to home")).toBeInTheDocument();
  });

  it("hides the minimal action when asked", () => {
    render(<AppHeader mode="minimal" showBackToHome={false} />);

    expect(screen.queryByText("Back to home")).not.toBeInTheDocument();
  });
});
