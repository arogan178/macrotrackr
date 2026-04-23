import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { RequireCompleteProfile } from "./RequireCompleteProfile";

vi.mock("@tanstack/react-router", () => ({
  Navigate: ({ to }: { to: string }) => <div data-testid="navigate">{to}</div>,
  useLocation: () => ({ pathname: "/home", search: {} }),
}));

vi.mock("@/config/runtime", () => ({
  isClerkAuthMode: false,
}));

vi.mock("@/hooks/auth/useAuthState", () => ({
  useAppAuthState: () => ({
    isLoaded: true,
    isSignedIn: true,
  }),
}));

const useUserMock = vi.fn();

vi.mock("@/hooks/auth/useAuthQueries", () => ({
  useUser: (...arguments_: unknown[]) => useUserMock(...arguments_),
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

describe("RequireCompleteProfile", () => {
  it("renders children in local auth mode even if user profile query is unresolved", () => {
    useUserMock.mockReturnValue({
      data: null,
      isLoading: false,
    });

    const queryClient = createQueryClient();

    render(
      <QueryClientProvider client={queryClient}>
        <RequireCompleteProfile>
          <div data-testid="protected-content">Protected content</div>
        </RequireCompleteProfile>
      </QueryClientProvider>,
    );

    expect(screen.getByTestId("protected-content")).toBeInTheDocument();
    expect(screen.queryByTestId("navigate")).not.toBeInTheDocument();
  });
});
