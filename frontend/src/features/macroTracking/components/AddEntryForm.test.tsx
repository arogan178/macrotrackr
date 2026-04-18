import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import AddEntryForm from "./AddEntryForm";

vi.mock("@/features/macroTracking/components/CalorieSearchForm", () => ({
  default: ({ onResult }: { onResult: (value: unknown) => void }) => (
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
});
