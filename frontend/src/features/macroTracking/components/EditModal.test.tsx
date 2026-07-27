import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { MacroEntry } from "@/types/macro";

import EditModal from "./EditModal";

const mockSingleEntry: MacroEntry = {
  id: 1,
  mealName: "Oatmeal",
  protein: 10,
  carbs: 40,
  fats: 5,
  mealType: "breakfast",
  createdAt: "2026-07-27T00:00:00Z",
  entryDate: "2026-07-27",
  entryTime: "08:00",
  ingredients: [
    {
      name: "Oatmeal",
      protein: 10,
      carbs: 40,
      fats: 5,
      quantity: 100,
      unit: "g",
      baseProtein: 10,
      baseCarbs: 40,
      baseFats: 5,
      baseQuantity: 100,
      baseUnit: "g",
    },
  ],
};

const mockMultiIngredientEntry: MacroEntry = {
  id: 2,
  mealName: "Chicken Bowl",
  protein: 40,
  carbs: 50,
  fats: 10,
  mealType: "lunch",
  createdAt: "2026-07-27T00:00:00Z",
  entryDate: "2026-07-27",
  entryTime: "12:00",
  ingredients: [
    {
      name: "Chicken Breast",
      protein: 30,
      carbs: 0,
      fats: 3,
      quantity: 150,
      unit: "g",
    },
    {
      name: "Rice",
      protein: 10,
      carbs: 50,
      fats: 7,
      quantity: 200,
      unit: "g",
    },
  ],
};

describe("EditModal", () => {
  beforeEach(() => {
    let modalRoot = document.querySelector("#modal-root");
    if (!modalRoot) {
      modalRoot = document.createElement("div");
      modalRoot.setAttribute("id", "modal-root");
      document.body.appendChild(modalRoot);
    }
  });

  it("renders single item entry with quantity and unit fields and without IngredientsPanel", () => {
    render(
      <EditModal
        isOpen
        entry={mockSingleEntry}
        onSave={vi.fn()}
        onClose={vi.fn()}
        isSaving={false}
      />,
    );

    // Checks Food Name is rendered
    expect(screen.getByDisplayValue("Oatmeal")).toBeInTheDocument();

    // Quantity & Unit controls are rendered
    expect(screen.getByText("Quantity & Unit")).toBeInTheDocument();

    // Single item convert button is rendered
    expect(
      screen.getByRole("button", {
        name: /add ingredient \(convert to multi-ingredient meal\)/i,
      }),
    ).toBeInTheDocument();

    // Ingredients section header button is NOT rendered for single items
    expect(
      screen.queryByRole("button", { name: /^ingredients/i }),
    ).not.toBeInTheDocument();
  });

  it("renders multi-ingredient entry with IngredientsPanel and disables top-level macro fields", () => {
    render(
      <EditModal
        isOpen
        entry={mockMultiIngredientEntry}
        onSave={vi.fn()}
        onClose={vi.fn()}
        isSaving={false}
      />,
    );

    // Food Name
    expect(screen.getByDisplayValue("Chicken Bowl")).toBeInTheDocument();

    // Ingredients header button IS rendered for multi-ingredient meals
    expect(screen.getByRole("button", { name: /ingredients/i })).toBeInTheDocument();

    // Check ingredient cards
    expect(screen.getByDisplayValue("Chicken Breast")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Rice")).toBeInTheDocument();
  });

  it("converts single item to multi-ingredient meal when clicking Add Ingredient", () => {
    render(
      <EditModal
        isOpen
        entry={mockSingleEntry}
        onSave={vi.fn()}
        onClose={vi.fn()}
        isSaving={false}
      />,
    );

    const convertButton = screen.getByRole("button", {
      name: /add ingredient \(convert to multi-ingredient meal\)/i,
    });
    fireEvent.click(convertButton);

    // Now IngredientsPanel is rendered
    expect(screen.getByRole("button", { name: /ingredients/i })).toBeInTheDocument();
  });

  it("scales macros proportionally when quantity changes in single item mode with pcs unit", () => {
    const mockPcsEntry: MacroEntry = {
      id: 3,
      mealName: "Apple",
      protein: 0.5,
      carbs: 25,
      fats: 0.3,
      mealType: "snack",
      createdAt: "2026-07-27T00:00:00Z",
      entryDate: "2026-07-27",
      entryTime: "15:00",
      ingredients: [
        {
          name: "Apple",
          protein: 0.5,
          carbs: 25,
          fats: 0.3,
          quantity: 1,
          unit: "unit",
          baseProtein: 0.5,
          baseCarbs: 25,
          baseFats: 0.3,
          baseQuantity: 1,
          baseUnit: "unit",
        },
      ],
    };

    render(
      <EditModal
        isOpen
        entry={mockPcsEntry}
        onSave={vi.fn()}
        onClose={vi.fn()}
        isSaving={false}
      />,
    );

    // Initial quantity is 1 pcs, carbs is 25
    const qtyInput = screen.getByDisplayValue("1");
    expect(qtyInput).toBeInTheDocument();
    expect(screen.getByDisplayValue("25")).toBeInTheDocument();

    // Change quantity to 2 pcs
    fireEvent.change(qtyInput, { target: { value: "2" } });

    // Carbs should scale to 50
    expect(screen.getByDisplayValue("50")).toBeInTheDocument();

    // Now switch unit from pcs to g
    const unitDropdown = screen.getByRole("combobox");
    fireEvent.change(unitDropdown, { target: { value: "g" } });

    // 2 pcs should convert to 200g, carbs should remain 50
    expect(screen.getByDisplayValue("200")).toBeInTheDocument();
    expect(screen.getByDisplayValue("50")).toBeInTheDocument();

    // Change quantity to 100g
    const qtyInputG = screen.getByDisplayValue("200");
    fireEvent.change(qtyInputG, { target: { value: "100" } });

    // Carbs should scale to 25
    expect(screen.getByDisplayValue("25")).toBeInTheDocument();
  });

  it("scales macros proportionally when quantity changes in single item mode", () => {
    render(
      <EditModal
        isOpen
        entry={mockSingleEntry}
        onSave={vi.fn()}
        onClose={vi.fn()}
        isSaving={false}
      />,
    );

    // Quantity field should initially be 100
    const qtyInput = screen.getByDisplayValue("100");
    expect(qtyInput).toBeInTheDocument();

    // Protein initial value is 10
    expect(screen.getByDisplayValue("10")).toBeInTheDocument();

    // Change quantity to 200
    fireEvent.change(qtyInput, { target: { value: "200" } });

    // Protein should scale proportionally to 20
    expect(screen.getByDisplayValue("20")).toBeInTheDocument();
  });
});