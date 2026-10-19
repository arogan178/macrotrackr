import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import ProfileSetupPage from "./ProfileSetupPage";

const { userState } = vi.hoisted(() => ({
  userState: { data: undefined as object | undefined, isLoading: false },
}));

vi.mock("@/config/runtime", () => ({ isClerkAuthMode: true }));
vi.mock("@clerk/react", () => ({
  useAuth: () => ({ isSignedIn: true, isLoaded: true }),
}));
vi.mock("@tanstack/react-router", () => ({
  Navigate: ({ to }: { to: string }) => <p>redirected to {to}</p>,
  useSearch: () => ({}),
}));
vi.mock("@/hooks/auth/useAuthQueries", () => ({ useUser: () => userState }));
vi.mock("@/features/auth/utils/redirect", () => ({
  normalizeAuthRedirect: () => "/home",
  resolveProfileCompletion: (user?: { complete?: boolean }) =>
    user?.complete ?? false,
}));
vi.mock("@/features/auth/components/AuthPageShell", () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));
vi.mock("@/features/auth/components/ProfileCreationForm", () => ({
  ProfileCreationForm: () => <p>setup form</p>,
}));

describe("ProfileSetupPage", () => {
  beforeEach(() => {
    userState.data = undefined;
    userState.isLoading = false;
  });

  it("sends a user who arrives with a finished profile home", () => {
    userState.data = { complete: true };

    render(<ProfileSetupPage />);

    expect(screen.getByText("redirected to /home")).toBeInTheDocument();
  });

  it("leaves the destination to the form once it completes the profile", () => {
    userState.data = { complete: false };
    const { rerender } = render(<ProfileSetupPage />);
    expect(screen.getByText("setup form")).toBeInTheDocument();

    userState.data = { complete: true };
    rerender(<ProfileSetupPage />);

    expect(screen.queryByText(/redirected to/)).not.toBeInTheDocument();
  });
});
