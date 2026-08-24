import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { RedirectSignedInToApp } from "@/routes/-RedirectSignedInToApp";

const useAppAuthStateMock = vi.fn();

vi.mock("@/hooks/auth/useAuthState", () => ({
  useAppAuthState: (...arguments_: unknown[]) => useAppAuthStateMock(...arguments_),
}));

vi.mock("@tanstack/react-router", () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
}));

describe("RedirectSignedInToApp", () => {
  beforeEach(() => {
    useAppAuthStateMock.mockReset();
  });

  it("sends a signed-in visitor to the app", () => {
    useAppAuthStateMock.mockReturnValue({ isLoaded: true, isSignedIn: true });

    render(
      <RedirectSignedInToApp>
        <div data-testid="children">Landing content</div>
      </RedirectSignedInToApp>,
    );

    expect(screen.getByTestId("navigate")).toHaveTextContent("/home");
    expect(screen.queryByTestId("children")).not.toBeInTheDocument();
  });

  it("renders the landing page for a signed-out visitor", () => {
    useAppAuthStateMock.mockReturnValue({ isLoaded: true, isSignedIn: false });

    render(
      <RedirectSignedInToApp>
        <div data-testid="children">Landing content</div>
      </RedirectSignedInToApp>,
    );

    expect(screen.getByTestId("children")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });

  it("renders the landing page while auth is still resolving, rather than a spinner", () => {
    useAppAuthStateMock.mockReturnValue({ isLoaded: false, isSignedIn: false });

    render(
      <RedirectSignedInToApp>
        <div data-testid="children">Landing content</div>
      </RedirectSignedInToApp>,
    );

    expect(screen.getByTestId("children")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });
});
