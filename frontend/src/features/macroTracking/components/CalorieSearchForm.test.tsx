import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { MotionGlobalConfig } from "motion/react";
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

import { macrosApi } from "@/api/macros";
import { type SavedMeal, savedMealsApi } from "@/api/savedMeals";
import { useStore } from "@/store/store";

import CalorieSearchForm from "./CalorieSearchForm";

vi.mock("@/api/macros", () => ({
  macrosApi: {
    search: vi.fn(),
    getByBarcode: vi.fn(),
  },
}));

vi.mock("@/api/savedMeals", () => ({
  savedMealsApi: {
    getAll: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
}));

const oats: SavedMeal = {
  id: 5,
  name: "Oats",
  mealType: "breakfast",
  protein: 10,
  carbs: 50,
  fats: 5,
  calories: 285,
  ingredients: [
    {
      name: "Oats",
      protein: 10,
      carbs: 50,
      fats: 5,
      quantity: 100,
      unit: "g",
      baseProtein: 10,
      baseCarbs: 50,
      baseFats: 5,
      baseQuantity: 100,
      baseUnit: "g",
    },
  ],
  createdAt: "2026-09-01T08:00:00Z",
};

const mockSavedMeals = (meals: SavedMeal[]) => {
  vi.mocked(savedMealsApi.getAll).mockResolvedValue({
    meals,
    count: meals.length,
    limit: 5,
    isPro: true,
  });
};

const openSavedMealEditor = async (mealName: string) => {
  fireEvent.focus(screen.getByRole("textbox", { name: "Search for food" }));
  fireEvent.click(screen.getByRole("tab", { name: "Saved Meals" }));
  fireEvent.click(
    await screen.findByRole("button", { name: `Edit ${mealName}` }),
  );

  return screen.getByRole("dialog");
};

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
  // jsdom never finishes the tab's exit animation, so the Saved Meals tab
  // would never mount.
  beforeAll(() => {
    MotionGlobalConfig.skipAnimations = true;
  });

  afterAll(() => {
    MotionGlobalConfig.skipAnimations = false;
  });

  beforeEach(() => {
    vi.clearAllMocks();
    mockSavedMeals([]);
    let modalRoot = document.querySelector("#modal-root");
    if (!modalRoot) {
      modalRoot = document.createElement("div");
      modalRoot.setAttribute("id", "modal-root");
      document.body.appendChild(modalRoot);
    }
  });

  it("focuses the search input after the delay when focusOnOpen is set", () => {
    vi.useFakeTimers();
    try {
      renderWithQueryClient(
        <CalorieSearchForm
          onResult={() => {}}
          onSelectSavedMeal={() => {}}
          focusOnOpen
        />,
      );
      const input = screen.getByRole("textbox", { name: "Search for food" });
      expect(input).not.toHaveFocus();

      act(() => {
        vi.advanceTimersByTime(300);
      });
      expect(input).toHaveFocus();
      // Focusing for the user must not cover the form with suggestions.
      expect(screen.queryByText("Recents")).not.toBeInTheDocument();

      fireEvent.click(input);
      expect(screen.getByText("Recents")).toBeInTheDocument();
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not focus the search input without focusOnOpen", async () => {
    renderWithQueryClient(
      <CalorieSearchForm onResult={() => {}} onSelectSavedMeal={() => {}} />,
    );
    await new Promise((resolve) => setTimeout(resolve, 350));
    expect(screen.getByRole("textbox", { name: "Search for food" })).not.toHaveFocus();
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

  it("orders Recents by how often a food was logged and shows the count", () => {
    const logged = (id: number, foodName: string) => ({
      id,
      foodName,
      mealName: "Snack",
      protein: 1,
      carbs: 20,
      fats: 0.5,
      mealType: "snack" as const,
      entryDate: "2026-09-20",
      entryTime: "10:00",
      createdAt: "2026-09-20T10:00:00Z",
    });

    renderWithQueryClient(
      <CalorieSearchForm
        onResult={() => {}}
        onSelectSavedMeal={() => {}}
        recentEntries={[
          logged(1, "Apple"),
          logged(2, "Oats"),
          logged(3, "Oats"),
          logged(4, "Oats"),
        ]}
      />,
    );

    fireEvent.focus(screen.getByRole("textbox", { name: "Search for food" }));

    const recents = screen.getAllByRole("button", { name: /kcal/ });
    expect(recents.map((button) => button.textContent)).toEqual([
      expect.stringMatching(/^Oats×3/),
      expect.stringMatching(/^Apple(?!×)/),
    ]);
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

  it("edits a single-ingredient saved meal and keeps the list open behind it", async () => {
    mockSavedMeals([oats]);
    vi.mocked(savedMealsApi.update).mockResolvedValue({
      ...oats,
      name: "Overnight oats",
    });

    renderWithQueryClient(
      <CalorieSearchForm onResult={() => {}} onSelectSavedMeal={() => {}} />,
    );

    const dialog = await openSavedMealEditor("Oats");
    // The modal is portalled outside the search wrapper.
    fireEvent.mouseDown(dialog);

    fireEvent.change(screen.getByLabelText(/^Name/), {
      target: { value: "Overnight oats" },
    });
    fireEvent.change(screen.getByLabelText("Protein (g)"), {
      target: { value: "12" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });
    expect(savedMealsApi.update).toHaveBeenCalledWith(5, {
      name: "Overnight oats",
      mealType: "breakfast",
      protein: 12,
      carbs: 50,
      fats: 5,
      ingredients: [
        expect.objectContaining({
          name: "Oats",
          protein: 12,
          quantity: 100,
          baseProtein: undefined,
          baseCarbs: undefined,
          baseFats: undefined,
        }),
      ],
    });
    expect(screen.getByRole("tab", { name: "Saved Meals" })).toBeInTheDocument();
  });

  it("only renames and retypes a multi-ingredient saved meal", async () => {
    mockSavedMeals([
      {
        ...oats,
        name: "Chicken bowl",
        ingredients: [
          { name: "Chicken", protein: 30, carbs: 0, fats: 3 },
          { name: "Rice", protein: 4, carbs: 45, fats: 1 },
        ],
      },
    ]);
    vi.mocked(savedMealsApi.update).mockResolvedValue(oats);

    renderWithQueryClient(
      <CalorieSearchForm onResult={() => {}} onSelectSavedMeal={() => {}} />,
    );

    await openSavedMealEditor("Chicken bowl");

    expect(screen.queryByLabelText("Protein (g)")).not.toBeInTheDocument();
    expect(
      screen.getByText("Macros come from its 2 ingredients."),
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Meal Type"), {
      target: { value: "dinner" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(savedMealsApi.update).toHaveBeenCalledWith(5, {
        name: "Chicken bowl",
        mealType: "dinner",
      });
    });
  });

  it("rescales an ingredient of a multi-ingredient saved meal and saves the new totals", async () => {
    const chicken = {
      name: "Chicken",
      protein: 30,
      carbs: 0,
      fats: 3,
      quantity: 100,
      unit: "g",
    };
    const rice = {
      name: "Rice",
      protein: 4,
      carbs: 45,
      fats: 1,
      quantity: 150,
      unit: "g",
    };
    mockSavedMeals([
      { ...oats, name: "Chicken bowl", ingredients: [chicken, rice] },
    ]);
    vi.mocked(savedMealsApi.update).mockResolvedValue(oats);

    renderWithQueryClient(
      <CalorieSearchForm onResult={() => {}} onSelectSavedMeal={() => {}} />,
    );

    const dialog = await openSavedMealEditor("Chicken bowl");
    const [chickenQuantity] = within(dialog).getAllByRole("spinbutton");
    fireEvent.change(chickenQuantity, { target: { value: "250" } });

    // 75g protein and 7.5g fat: 300 + 67.5 kcal.
    expect(within(dialog).getByText("368 kcal")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(savedMealsApi.update).toHaveBeenCalledWith(5, {
        name: "Chicken bowl",
        mealType: "breakfast",
        protein: 79,
        carbs: 45,
        fats: 8.5,
        ingredients: [
          { ...chicken, quantity: 250, protein: 75, fats: 7.5 },
          rice,
        ],
      });
    });
  });

  it("shows an error toast and stays open when the update fails", async () => {
    const showNotification = vi.fn();
    useStore.setState({ showNotification });
    mockSavedMeals([oats]);
    vi.mocked(savedMealsApi.update).mockRejectedValue(
      new Error("Saved meal not found"),
    );

    renderWithQueryClient(
      <CalorieSearchForm onResult={() => {}} onSelectSavedMeal={() => {}} />,
    );

    await openSavedMealEditor("Oats");
    fireEvent.click(screen.getByRole("button", { name: "Save" }));

    await waitFor(() => {
      expect(showNotification).toHaveBeenCalledWith(
        "Saved meal not found",
        "error",
      );
    });
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });
});
