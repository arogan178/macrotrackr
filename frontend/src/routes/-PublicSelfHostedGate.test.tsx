import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PublicSelfHostedGate } from "@/routes/-PublicSelfHostedGate";

let authMode: "clerk" | "local" = "clerk";
const useAppAuthStateMock = vi.fn();

vi.mock("@/config/runtime", () => ({
  get isLocalAuthMode() {
    return authMode === "local";
  },
}));

vi.mock("@/hooks/auth/useAuthState", () => ({
  useAppAuthState: (...arguments_: unknown[]) => useAppAuthStateMock(...arguments_),
}));

vi.mock("@tanstack/react-router", () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
}));

describe("PublicSelfHostedGate", () => {
  beforeEach(() => {
    authMode = "clerk";
    useAppAuthStateMock.mockReset();
    useAppAuthStateMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    });
  });

  it("renders children in managed mode", () => {
    render(
      <PublicSelfHostedGate>
        <div data-testid="children">Landing content</div>
      </PublicSelfHostedGate>,
    );

    expect(screen.getByTestId("children")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });

  it("redirects signed-out self-hosted users to login", () => {
    authMode = "local";

    render(
      <PublicSelfHostedGate>
        <div data-testid="children">Landing content</div>
      </PublicSelfHostedGate>,
    );

    expect(screen.getByTestId("navigate")).toHaveTextContent("/login");
  });

  it("redirects signed-in self-hosted users to home", () => {
    authMode = "local";
    useAppAuthStateMock.mockReturnValue({
      isLoaded: true,
      isSignedIn: true,
    });

    render(
      <PublicSelfHostedGate>
        <div data-testid="children">Landing content</div>
      </PublicSelfHostedGate>,
    );

    expect(screen.getByTestId("navigate")).toHaveTextContent("/home");
  });
});
