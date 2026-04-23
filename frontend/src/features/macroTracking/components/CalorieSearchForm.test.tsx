import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import CalorieSearchForm from "./CalorieSearchForm";

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

describe("CalorieSearchForm", () => {
  it("renders without crashing", () => {
    const { container } = renderWithQueryClient(
      <CalorieSearchForm onResult={() => {}} onSelectSavedMeal={() => {}} />,
    );
    expect(container).toBeDefined();
  });
});
