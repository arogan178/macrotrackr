import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProFeature from "./ProFeature";

let authMode: "clerk" | "local" = "clerk";

vi.mock("@/config/runtime", () => ({
  get isLocalAuthMode() {
    return authMode === "local";
  },
}));

// Mock the useSubscriptionStatus hook
vi.mock("@/hooks/useSubscriptionStatus", () => ({
  useSubscriptionStatus: vi.fn(() => ({
    subscriptionStatus: "free",
    setSubscriptionStatus: vi.fn(),
  })),
}));

describe("ProFeature", () => {
  beforeEach(() => {
    authMode = "clerk";
  });

  it("renders children in self-hosted mode", () => {
    authMode = "local";

    const { container } = render(
      <ProFeature>
        <div data-testid="child-content">Protected Content</div>
      </ProFeature>,
    );

    expect(
      container.querySelector('[data-testid="child-content"]'),
    ).toBeInTheDocument();
    expect(container.querySelector('[aria-label="Pro feature"]')).not.toBeInTheDocument();
  });

  it("renders children when not pro", () => {
    const { container } = render(
      <ProFeature>
        <div data-testid="child-content">Protected Content</div>
      </ProFeature>,
    );

    expect(container).toBeTruthy();
    expect(
      container.querySelector('[data-testid="child-content"]'),
    ).toBeInTheDocument();
  });

  it("renders ProBadge when not pro", () => {
    const { container } = render(
      <ProFeature>
        <div>Content</div>
      </ProFeature>,
    );

    expect(
      container.querySelector('[aria-label="Pro feature"]'),
    ).toBeInTheDocument();
  });

  it("renders without crashing", () => {
    const { container } = render(
      <ProFeature>
        <div>Content</div>
      </ProFeature>,
    );

    expect(container.firstChild).toBeTruthy();
  });
});
