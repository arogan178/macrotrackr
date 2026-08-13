import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import MainLayout, { isPublicPathname } from "./MainLayout";

let pathname = "/home";

vi.mock("@tanstack/react-router", () => ({
  useLocation: () => ({ pathname }),
}));

vi.mock("@/components/notifications/components/NotificationManager", () => ({
  default: () => <div data-testid="notifications" />,
}));

vi.mock("@/hooks/auth/useAuthQueries", () => ({
  useUser: () => ({ data: undefined }),
}));

vi.mock("@/hooks/auth/useAuthState", () => ({
  useAppAuthState: () => ({ isLoaded: true, isSignedIn: true }),
}));

vi.mock("./AppHeader", () => ({
  default: ({ mode }: { mode: string }) => (
    <nav data-testid="app-navbar" data-mode={mode} />
  ),
}));

describe("isPublicPathname", () => {
  it("treats the landing routes as public", () => {
    expect(isPublicPathname("/")).toBe(true);
    expect(isPublicPathname("/login")).toBe(true);
  });

  it("treats the route trees that render their own header as public", () => {
    expect(isPublicPathname("/tools")).toBe(true);
    expect(isPublicPathname("/tools/tdee-calculator")).toBe(true);
    expect(isPublicPathname("/blog")).toBe(true);
    expect(isPublicPathname("/blog/some-article")).toBe(true);
  });

  it("does not match routes that merely share a prefix", () => {
    expect(isPublicPathname("/toolsomething")).toBe(false);
    expect(isPublicPathname("/blogger")).toBe(false);
  });

  it("keeps the signed-in app routes private", () => {
    expect(isPublicPathname("/home")).toBe(false);
    expect(isPublicPathname("/goals")).toBe(false);
    expect(isPublicPathname("/settings")).toBe(false);
  });
});

describe("MainLayout", () => {
  beforeEach(() => {
    pathname = "/home";
  });

  it("renders the app header for a signed-in user on an app route", () => {
    render(<MainLayout>
      <div />
    </MainLayout>);

    expect(screen.getByTestId("app-navbar")).toHaveAttribute(
      "data-mode",
      "app",
    );
  });

  it("renders exactly one navigation bar on pages that own their header", () => {
    for (const route of ["/tools/tdee-calculator", "/blog/article"]) {
      pathname = route;
      const { unmount } = render(<MainLayout>
        <div />
      </MainLayout>);

      expect(screen.queryByTestId("app-navbar")).not.toBeInTheDocument();
      unmount();
    }
  });
});
