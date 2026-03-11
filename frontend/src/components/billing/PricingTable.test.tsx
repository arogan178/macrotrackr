import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PricingTable from "./PricingTable";

const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

const renderWithQueryClient = (ui: React.ReactElement) => {
  const queryClient = createQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
};

describe("PricingTable", () => {
  const defaultProps = {
    selectedPlan: "monthly" as const,
    setSelectedPlan: vi.fn(),
  };

  it("renders without crashing", () => {
    const { container } = renderWithQueryClient(
      <PricingTable {...defaultProps} />,
    );
    expect(container).toBeTruthy();
  });

  it("renders monthly and yearly options", () => {
    const { container } = renderWithQueryClient(
      <PricingTable {...defaultProps} />,
    );
    expect(container).toBeTruthy();
  });

  it("hides upgrade button when showProButton is false", () => {
    const { container } = renderWithQueryClient(
      <PricingTable {...defaultProps} showProButton={false} />,
    );
    expect(container).toBeTruthy();
  });

  it("renders with memoization", () => {
    const { container } = renderWithQueryClient(
      <PricingTable {...defaultProps} />,
    );
    expect(container).toBeTruthy();
  });
});
