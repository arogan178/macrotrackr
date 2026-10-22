import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AuthPageShell from "@/features/auth/components/AuthPageShell";

const navigateMock = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => navigateMock,
}));

describe("AuthPageShell", () => {
  it("leaves the way home to the logo", () => {
    render(
      <AuthPageShell title="Welcome back" description="Sign in to continue.">
        <div>Form content</div>
      </AuthPageShell>,
    );

    expect(screen.getByText("Form content")).toBeInTheDocument();
    expect(screen.queryByText("Back to home")).not.toBeInTheDocument();
  });
});
