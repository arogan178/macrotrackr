import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AddEntryForm from "./AddEntryForm";

vi.mock("@/features/macroTracking/components/CalorieSearchForm", () => ({
  default: ({ onResult }: { onResult: (value: unknown) => void }) => (
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
});
