import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { macrosApi } from "@/api/macros";

import CalorieSearchForm from "./CalorieSearchForm";

vi.mock("@/api/macros", () => ({
  macrosApi: {
    search: vi.fn(),
    getByBarcode: vi.fn(),
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
    let modalRoot = document.querySelector("#modal-root");
    if (!modalRoot) {
      modalRoot = document.createElement("div");
      modalRoot.setAttribute("id", "modal-root");
      document.body.appendChild(modalRoot);
    }
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

  it("allows selecting a recent entry from Recents tab in search overlay", async () => {
    const handleSelectSavedMeal = vi.fn();
    const recentEntries = [
      {
        id: 1,
        foodName: "Banana",
        mealName: "Snack",
        protein: 1.1,
        carbs: 23,
        fats: 0.3,
        mealType: "snack" as const,
        entryDate: "2026-08-10",
        entryTime: "10:00",
        createdAt: "2026-08-10T10:00:00Z",
      },
    ];

    renderWithQueryClient(
      <CalorieSearchForm
        onResult={() => {}}
        onSelectSavedMeal={handleSelectSavedMeal}
        recentEntries={recentEntries}
      />,
    );

    const input = screen.getByRole("textbox", { name: "Search for food" });
    fireEvent.focus(input);

    expect(screen.getByRole("tab", { name: "Recents" })).toBeInTheDocument();
    expect(screen.getByText("Banana")).toBeInTheDocument();

    const recentItemButton = screen.getByRole("button", { name: /banana/i });
    fireEvent.click(recentItemButton);

    expect(handleSelectSavedMeal).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "Banana",
        protein: 1.1,
        carbs: 23,
        fats: 0.3,
        mealType: "snack",
      }),
    );
  });

  it("opens barcode scanner and populates food result on scan/manual lookup", async () => {
    (macrosApi.getByBarcode as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({
      name: "Oat Milk Barcode Item",
      protein: 2.0,
      carbs: 14.0,
      fats: 3.0,
      energyKcal: 90,
      categories: "Beverages",
      servingQuantity: 240,
      servingUnit: "ml",
      rawQuantity: "240ml",
    });

    const onResultMock = vi.fn();

    renderWithQueryClient(
      <CalorieSearchForm onResult={onResultMock} onSelectSavedMeal={() => {}} />,
    );

    const scanButton = screen.getByRole("button", { name: "Scan barcode" });
    fireEvent.click(scanButton);

    expect(screen.getByText("Barcode Scanner")).toBeInTheDocument();

    const manualTab = screen.getByRole("button", { name: "Enter Barcode Manually" });
    fireEvent.click(manualTab);

    const barcodeInput = screen.getByLabelText(/barcode number/i);
    fireEvent.change(barcodeInput, { target: { value: "737628064502" } });

    const lookupButton = screen.getByRole("button", { name: "Look up product barcode" });
    fireEvent.click(lookupButton);

    await waitFor(() => {
      expect(onResultMock).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Oat Milk Barcode Item",
          protein: "2.0",
          carbs: "14.0",
          fats: "3.0",
          servingQuantity: 240,
          servingUnit: "ml",
        }),
      );
    });
  });
});
