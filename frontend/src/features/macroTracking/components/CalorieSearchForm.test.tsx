import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { macrosApi } from "@/api/macros";

import CalorieSearchForm from "./CalorieSearchForm";

vi.mock("@/api/macros", () => ({
  macrosApi: {
    search: vi.fn(),
  },
}));

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
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders without crashing", () => {
    const { container } = renderWithQueryClient(
      <CalorieSearchForm onResult={() => {}} onSelectSavedMeal={() => {}} />,
    );
    expect(container).toBeDefined();
  });

  it("scales calories and macros in dropdown according to portion size", async () => {
    (macrosApi.search as unknown as ReturnType<typeof vi.fn>).mockResolvedValue([
      {
        name: "Full Cream Milk",
        protein: 4.0,
        carbs: 10.0,
        fats: 0.5,
        energyKcal: 60,
        categories: "Dairy",
        servingQuantity: 250,
        servingUnit: "g",
        rawQuantity: "250g",
      },
    ]);

    const onResultMock = vi.fn();

    renderWithQueryClient(
      <CalorieSearchForm onResult={onResultMock} onSelectSavedMeal={() => {}} />,
    );

    const input = screen.getByRole("textbox", { name: "Search for food" });
    fireEvent.change(input, { target: { value: "milk" } });

    const searchButton = screen.getByRole("button", { name: "Search for food" });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(screen.getByText("Full Cream Milk")).toBeInTheDocument();
    });

    // 60 kcal * 2.5 = 150.0 kcal, 4g P * 2.5 = 10.0g, 10g C * 2.5 = 25.0g, 0.5g F * 2.5 = 1.3g
    expect(screen.getByText(/Calories: 150.0 kcal/)).toBeInTheDocument();

    const resultButton = screen.getByRole("button", { name: /Full Cream Milk/ });
    fireEvent.click(resultButton);

    expect(onResultMock).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Full Cream Milk",
        servingQuantity: 250,
        servingUnit: "g",
        protein: "4.0",
        carbs: "10.0",
        fats: "0.5",
      }),
    );
  });
});
