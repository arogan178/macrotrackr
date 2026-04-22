import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppAuthState } from "@/hooks/auth/useAuthState";

import CustomPricingCards from "./CustomPricingCards";

let authMode: "clerk" | "local" = "clerk";

vi.mock("@/config/runtime", () => ({
  get isLocalAuthMode() {
    return authMode === "local";
  },
}));

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

vi.mock("@/hooks/auth/useAuthState", () => ({
  useAppAuthState: vi.fn(),
}));

vi.mock("posthog-js/react", () => ({
  usePostHog: () => ({ capture: vi.fn() }),
}));

vi.mock("@/store/store", () => ({
  useStore: (selector: (state: { subscriptionStatus: string }) => unknown) =>
    selector({ subscriptionStatus: "free" }),
}));

describe("CustomPricingCards", () => {
  beforeEach(() => {
    authMode = "clerk";
    vi.clearAllMocks();
    vi.mocked(useAppAuthState).mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    });
  });

  it("renders in local mode without Clerk provider", () => {
    authMode = "local";

    render(<CustomPricingCards showUpgradeButtons={false} />);

    expect(
      screen.getByRole("button", { name: /free plan/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /current plan/i }),
    ).toBeInTheDocument();
    expect(navigateMock).not.toHaveBeenCalled();
  });
});
