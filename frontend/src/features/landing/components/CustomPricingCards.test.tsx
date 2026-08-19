import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { useAppAuthState } from "@/hooks/auth/useAuthState";

import CustomPricingCards from "./CustomPricingCards";

const mocks = vi.hoisted(() => ({
  authMode: "clerk" as "clerk" | "local",
  capture: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("@/hooks/useEntitlements", () => ({
  useEntitlements: () => ({
    hasPaidPlan: mocks.authMode === "local",
  }),
}));

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mocks.navigate,
}));

vi.mock("@/hooks/auth/useAuthState", () => ({
  useAppAuthState: vi.fn(),
}));

vi.mock("@/lib/productAnalytics", () => ({
  useProductAnalytics: () => ({ capture: mocks.capture }),
}));

describe("CustomPricingCards", () => {
  beforeEach(() => {
    mocks.authMode = "clerk";
    vi.clearAllMocks();
    vi.mocked(useAppAuthState).mockReturnValue({
      isLoaded: true,
      isSignedIn: false,
    });
  });

  it("renders in local mode without Clerk provider", () => {
    mocks.authMode = "local";

    render(<CustomPricingCards showUpgradeButtons={false} />);

    expect(
      screen.getByRole("button", { name: /free plan/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /current plan/i }),
    ).toBeInTheDocument();
    expect(mocks.navigate).not.toHaveBeenCalled();
  });

  it("shows the discount implied by the configured prices", () => {
    render(<CustomPricingCards showUpgradeButtons={false} />);

    expect(screen.getByText("Save 37%")).toBeInTheDocument();
  });

  it("captures the free pricing call to action", () => {
    render(<CustomPricingCards showUpgradeButtons={false} />);

    fireEvent.click(
      screen.getByRole("button", { name: /create free account/i }),
    );

    expect(mocks.capture).toHaveBeenCalledWith({
      event: "landing_cta_clicked",
      properties: {
        destination: "register",
        source: "pricing_free",
      },
    });
  });
});
