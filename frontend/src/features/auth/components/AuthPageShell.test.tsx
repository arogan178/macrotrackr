import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AuthPageShell from "@/features/auth/components/AuthPageShell";

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

describe("AuthPageShell", () => {
  it("shows back-to-home button by default", () => {
    render(
      <AuthPageShell
        eyebrow="Account Access"
        title="Welcome back"
        description="Sign in to continue."
      >
        <div>Form content</div>
      </AuthPageShell>,
    );

    expect(screen.getByText("Back to home")).toBeInTheDocument();
  });

  it("hides back-to-home button when disabled", () => {
    render(
      <AuthPageShell
        eyebrow="Account Access"
        title="Welcome back"
        description="Sign in to continue."
        showBackToHome={false}
      >
        <div>Form content</div>
      </AuthPageShell>,
    );

    expect(screen.queryByText("Back to home")).not.toBeInTheDocument();
  });
});
