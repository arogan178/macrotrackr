import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import ChangePasswordForm from "./ChangePasswordForm";

vi.mock("@/hooks/auth/useAuthQueries", () => ({
  useChangePassword: () => ({
    mutateAsync: vi.fn().mockResolvedValue(undefined),
    isPending: false,
  }),
}));

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithProviders = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();

  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe("ChangePasswordForm", () => {
  it("renders without crashing", () => {
    const { container } = renderWithProviders(<ChangePasswordForm />);
    expect(container).toBeDefined();
  });
});
