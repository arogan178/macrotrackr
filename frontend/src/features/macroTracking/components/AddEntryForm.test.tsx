import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import AddEntryForm from "./AddEntryForm";

vi.mock("@/features/macroTracking/components/CalorieSearchForm", () => ({
  default: ({
    onResult,
    onSelectSavedMeal,
  }: {
    onResult: (value: unknown) => void;
    onSelectSavedMeal: (meal: unknown) => void;
  }) => (
    <div>
      <button
        type="button"
        onClick={() =>
          onResult({
            protein: "12.6",
            carbs: "0.2",
            fats: "9",
            name: "Eggs",
            servingQuantity: 100,
            servingUnit: "g",
            rawQuantity: "6 eggs",
          })
        }
      >
        Select mocked food
      </button>
      <button
        type="button"
        onClick={() =>
          onResult({
            protein: "4.0",
            carbs: "10.0",
            fats: "0.5",
            name: "Full Cream Milk",
            servingQuantity: 250,
            servingUnit: "g",
            rawQuantity: "250g",
          })
        }
      >
        Select milk
      </button>
      <button
        type="button"
        onClick={() =>
          onSelectSavedMeal({
            name: "chia seeds",
            protein: 6.8,
            carbs: 12.8,
            fats: 12.2,
            mealType: "snack",
            ingredients: [
              {
                name: "chia seeds",
                protein: 6.8,
                carbs: 12.8,
                fats: 12.2,
                quantity: 40,
                unit: "g",
                baseProtein: 17,
                baseCarbs: 32,
                baseFats: 30.5,
                baseQuantity: 100,
                baseUnit: "g",
              },
            ],
          })
        }
      >
        Select single saved meal
      </button>
      <button
        type="button"
        onClick={() =>
          onSelectSavedMeal({
            name: "Big Breakfast",
            protein: 30,
            carbs: 26,
            fats: 20,
            mealType: "breakfast",
            ingredients: [
              {
                name: "Eggs",
                protein: 24,
                carbs: 1,
                fats: 18,
                quantity: 200,
                unit: "g",
              },
              {
                name: "Toast",
                protein: 6,
                carbs: 25,
                fats: 2,
                quantity: 50,
                unit: "g",
              },
            ],
          })
        }
      >
        Select grouped saved meal
      </button>
    </div>
  ),
}));

describe("AddEntryForm", () => {
  it("renders without crashing", () => {
    const { container } = render(
      <AddEntryForm onSubmit={async () => {}} isSaving={false} />,
    );
    expect(container).toBeDefined();
  });

  it("explains why the submit button is disabled, at every breakpoint", () => {
    render(<AddEntryForm onSubmit={async () => {}} isSaving={false} />);

    const submit = screen.getByRole("button", { name: /add entry/i });
    expect(submit).toBeDisabled();
    expect(
      screen.queryByText("Name this meal to save it"),
    ).not.toBeInTheDocument();

    // Entering macros without meal name triggers the hint
    fireEvent.change(screen.getByLabelText("Protein"), { target: { value: "25" } });
    fireEvent.change(screen.getByLabelText("Carbs"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Fats"), { target: { value: "5" } });

    // The hint must not be hidden below the sm breakpoint: a disabled button
    // with no visible reason is a dead end on mobile.
    const hint = screen.getByText("Name this meal to save it");
    expect(hint.className).not.toMatch(/hidden/);

    fireEvent.click(screen.getByRole("button", { name: "Select milk" }));
    expect(
      screen.queryByText("Name this meal to save it"),
    ).not.toBeInTheDocument();
    expect(submit).toBeEnabled();
  });

  it("tells the user what is missing, one thing at a time, until the entry can be added", async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<AddEntryForm onSubmit={handleSubmit} isSaving={false} />);
    const submit = screen.getByRole("button", { name: /add entry/i });

    await user.type(screen.getByLabelText("Protein"), "0");
    expect(screen.getByText("Enter protein, carbs and fats")).toBeInTheDocument();
    expect(submit).toBeDisabled();

    await user.type(screen.getByLabelText("Carbs"), "0");
    await user.type(screen.getByLabelText("Fats"), "0");
    expect(screen.getByText("Macros must add up to more than 0")).toBeInTheDocument();
    expect(submit).toBeDisabled();

    // Zero macros outrank a missing name, so a name alone does not clear the hint.
    const mealName = screen.getByPlaceholderText("e.g. Chicken Salad");
    await user.type(mealName, "Black coffee");
    expect(screen.getByText("Macros must add up to more than 0")).toBeInTheDocument();
    expect(submit).toBeDisabled();

    await user.clear(screen.getByLabelText("Fats"));
    await user.type(screen.getByLabelText("Fats"), "1");
    await user.clear(mealName);
    expect(screen.getByText("Name this meal to save it")).toBeInTheDocument();
    expect(submit).toBeDisabled();

    await user.type(mealName, "Coffee with cream");
    expect(screen.queryByText("Name this meal to save it")).not.toBeInTheDocument();
    await user.click(submit);

    await waitFor(() =>
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          mealName: "Coffee with cream",
          protein: 0,
          carbs: 0,
          fats: 1,
        }),
      ),
    );
  });

  it("hides the hint again when the user empties the form", async () => {
    const user = userEvent.setup();
    render(<AddEntryForm onSubmit={async () => {}} isSaving={false} />);
    const mealName = screen.getByPlaceholderText("e.g. Chicken Salad");

    await user.type(mealName, "Toast");
    expect(screen.getByText("Enter protein, carbs and fats")).toBeInTheDocument();

    await user.clear(mealName);
    expect(
      screen.queryByText("Enter protein, carbs and fats"),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /add entry/i })).toBeDisabled();
  });

  it("keeps date and time collapsed until asked for and expands on click", () => {
    render(<AddEntryForm onSubmit={async () => {}} isSaving={false} />);

    const summary = screen.getByText(/^Logged/);
    const disclosure = summary.closest("details");
    expect(disclosure).not.toBeNull();
    expect(disclosure).not.toHaveAttribute("open");
    expect(summary.textContent).toContain("now");

    fireEvent.click(summary);
    expect(disclosure).toHaveAttribute("open");
  });

  it("stamps each entry with the time it was added, not when the form opened", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 22, 23, 50));
    const handleSubmit = vi.fn();
    render(<AddEntryForm onSubmit={handleSubmit} isSaving={false} />);

    vi.setSystemTime(new Date(2026, 8, 23, 8, 5));
    fireEvent.change(screen.getByPlaceholderText("e.g. Chicken Salad"), {
      target: { value: "Oatmeal" },
    });
    fireEvent.change(screen.getByLabelText("Protein"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Carbs"), { target: { value: "40" } });
    fireEvent.change(screen.getByLabelText("Fats"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));

    await waitFor(() =>
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ entryDate: "2026-09-23", entryTime: "08:05" }),
      ),
    );
    vi.useRealTimers();
  });

  it("logs to the day given as defaultDate, at the current time of day", async () => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 8, 25, 13, 40));
    const handleSubmit = vi.fn();
    render(
      <AddEntryForm
        onSubmit={handleSubmit}
        isSaving={false}
        defaultDate="2026-09-20"
      />,
    );

    expect(screen.getByText(/^Logged/).textContent).toContain(
      "Sep 20, 2026 at 13:40",
    );
    fireEvent.change(screen.getByPlaceholderText("e.g. Chicken Salad"), {
      target: { value: "Oatmeal" },
    });
    fireEvent.change(screen.getByLabelText("Protein"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Carbs"), { target: { value: "40" } });
    fireEvent.change(screen.getByLabelText("Fats"), { target: { value: "5" } });
    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));

    await waitFor(() =>
      expect(handleSubmit).toHaveBeenCalledWith(
        expect.objectContaining({ entryDate: "2026-09-20", entryTime: "13:40" }),
      ),
    );
    vi.useRealTimers();
  });

  it("uses parsed serving units from selected food search results", () => {
    render(<AddEntryForm onSubmit={async () => {}} isSaving={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Select mocked food" }));

    const quantityInput = screen.getByPlaceholderText("100") as HTMLInputElement;
    const unitSelect = screen.getByDisplayValue("pcs") as HTMLSelectElement;

    expect(quantityInput.value).toBe("6");
    expect(unitSelect.value).toBe("unit");
  });

  it("calculates initial scaled macros and calories upon food item selection", () => {
    render(<AddEntryForm onSubmit={async () => {}} isSaving={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Select milk" }));

    const quantityInput = screen.getByPlaceholderText("100") as HTMLInputElement;
    const unitSelect = screen.getByDisplayValue("g") as HTMLSelectElement;

    expect(quantityInput.value).toBe("250");
    expect(unitSelect.value).toBe("g");

    const proteinInput = screen.getByLabelText("Protein") as HTMLInputElement;
    const carbsInput = screen.getByLabelText("Carbs") as HTMLInputElement;
    const fatsInput = screen.getByLabelText("Fats") as HTMLInputElement;

    expect(proteinInput.value).toBe("10");
    expect(carbsInput.value).toBe("25");
    expect(fatsInput.value).toBe("1.3");
  });

  it("restores custom quantity and unit when reselecting single-ingredient saved meal", () => {
    render(<AddEntryForm onSubmit={async () => {}} isSaving={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Select single saved meal" }));

    const quantityInput = screen.getByPlaceholderText("100") as HTMLInputElement;
    const unitSelect = screen.getByDisplayValue("g") as HTMLSelectElement;

    expect(quantityInput.value).toBe("40");
    expect(unitSelect.value).toBe("g");

    const proteinInput = screen.getByLabelText("Protein") as HTMLInputElement;
    expect(proteinInput.value).toBe("6.8");
  });

  it("submits individual ingredient breakdown for grouped saved meal", async () => {
    const handleSubmit = vi.fn();
    render(<AddEntryForm onSubmit={handleSubmit} isSaving={false} />);

    fireEvent.click(screen.getByRole("button", { name: "Select grouped saved meal" }));

    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));

    await waitFor(() => expect(handleSubmit).toHaveBeenCalled());
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        mealName: "Big Breakfast",
        ingredients: [
          expect.objectContaining({ name: "Eggs", quantity: 200, unit: "g", protein: 24 }),
          expect.objectContaining({ name: "Toast", quantity: 50, unit: "g", protein: 6 }),
        ],
      }),
    );
  });

  it("allows editing quantity/unit for custom entries and scales macros on quantity change", async () => {
    const handleSubmit = vi.fn();
    render(<AddEntryForm onSubmit={handleSubmit} isSaving={false} />);

    const mealNameInput = screen.getByPlaceholderText("e.g. Chicken Salad");
    fireEvent.change(mealNameInput, { target: { value: "Custom Chicken" } });

    const proteinInput = screen.getByLabelText("Protein");
    const carbsInput = screen.getByLabelText("Carbs");
    const fatsInput = screen.getByLabelText("Fats");

    fireEvent.change(proteinInput, { target: { value: "20" } });
    fireEvent.change(carbsInput, { target: { value: "10" } });
    fireEvent.change(fatsInput, { target: { value: "5" } });

    const quantityInput = screen.getByPlaceholderText("100") as HTMLInputElement;
    expect(quantityInput.disabled).toBe(false);

    // Double quantity from 100g to 200g
    fireEvent.change(quantityInput, { target: { value: "200" } });

    expect((proteinInput as HTMLInputElement).value).toBe("40");
    expect((carbsInput as HTMLInputElement).value).toBe("20");
    expect((fatsInput as HTMLInputElement).value).toBe("10");

    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));

    await waitFor(() => expect(handleSubmit).toHaveBeenCalled());
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        mealName: "Custom Chicken",
        protein: 40,
        carbs: 20,
        fats: 10,
        ingredients: [
          expect.objectContaining({
            name: "Custom Chicken",
            quantity: 200,
            unit: "g",
            baseProtein: 20,
            baseCarbs: 10,
            baseFats: 5,
            baseQuantity: 100,
            baseUnit: "g",
          }),
        ],
      }),
    );
  });

  it("submits saveAsMeal flag when Save as Meal button is toggled", async () => {
    const handleSubmit = vi.fn();
    render(<AddEntryForm onSubmit={handleSubmit} isSaving={false} />);

    fireEvent.change(screen.getByPlaceholderText("e.g. Chicken Salad"), {
      target: { value: "Oatmeal" },
    });
    fireEvent.change(screen.getByLabelText("Protein"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Carbs"), { target: { value: "40" } });
    fireEvent.change(screen.getByLabelText("Fats"), { target: { value: "5" } });

    const saveAsMealButton = screen.getByRole("button", { name: /save as meal/i });
    fireEvent.click(saveAsMealButton);

    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));

    await waitFor(() => expect(handleSubmit).toHaveBeenCalled());
    expect(handleSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        mealName: "Oatmeal",
        saveAsMeal: true,
      }),
    );
  });

  it("keeps the values when the submit fails", async () => {
    const handleSubmit = vi.fn().mockRejectedValue(new Error("Network down"));
    render(<AddEntryForm onSubmit={handleSubmit} isSaving={false} />);

    const mealNameInput = screen.getByPlaceholderText("e.g. Chicken Salad");
    fireEvent.change(mealNameInput, { target: { value: "Oatmeal" } });
    fireEvent.change(screen.getByLabelText("Protein"), { target: { value: "10" } });
    fireEvent.change(screen.getByLabelText("Carbs"), { target: { value: "40" } });
    fireEvent.change(screen.getByLabelText("Fats"), { target: { value: "5" } });

    fireEvent.click(screen.getByRole("button", { name: /add entry/i }));

    await waitFor(() => expect(handleSubmit).toHaveBeenCalled());
    expect(mealNameInput).toHaveValue("Oatmeal");
  });
});
