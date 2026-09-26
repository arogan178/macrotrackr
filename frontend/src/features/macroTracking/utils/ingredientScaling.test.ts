import { describe, expect, it } from "vitest";

import type { Ingredient } from "@/types/macro";

import {
  calculateTotalsFromIngredients,
  getGramsEquivalent,
  scaleIngredient,
} from "./ingredientScaling";

const chicken: Ingredient = {
  name: "Chicken",
  protein: 45,
  carbs: 0,
  fats: 4.5,
  quantity: 150,
  unit: "g",
  baseProtein: 30,
  baseCarbs: 0,
  baseFats: 3,
  baseQuantity: 100,
  baseUnit: "g",
};

describe("getGramsEquivalent", () => {
  it("converts weight and volume units", () => {
    expect(getGramsEquivalent(1, "kg")).toBe(1000);
    expect(getGramsEquivalent(1, "l")).toBe(1000);
    expect(getGramsEquivalent(250, "ml")).toBe(250);
  });

  it("treats a piece as 100g", () => {
    expect(getGramsEquivalent(2, "pcs")).toBe(200);
    expect(getGramsEquivalent(2, "unit")).toBe(200);
  });

  it("returns 0 for a missing or non-positive quantity", () => {
    expect(getGramsEquivalent(undefined, "g")).toBe(0);
    expect(getGramsEquivalent(0, "g")).toBe(0);
  });
});

describe("scaleIngredient", () => {
  it("scales macros from the base values", () => {
    expect(scaleIngredient(chicken, 200, "g")).toEqual({
      ...chicken,
      quantity: 200,
      unit: "g",
      protein: 60,
      carbs: 0,
      fats: 6,
    });
  });

  it("scales across units", () => {
    const scaled = scaleIngredient(chicken, 1, "oz");

    expect(scaled.unit).toBe("oz");
    expect(scaled.protein).toBe(8.5);
    expect(scaled.fats).toBe(0.9);
  });

  it("falls back to the current values when there is no base", () => {
    const rice: Ingredient = {
      name: "Rice",
      protein: 4,
      carbs: 45,
      fats: 1,
      quantity: 150,
      unit: "g",
    };

    expect(scaleIngredient(rice, 300, "g")).toMatchObject({
      protein: 8,
      carbs: 90,
      fats: 2,
    });
  });

  it("assumes 100g, or one piece, when the ingredient has no quantity", () => {
    const rice: Ingredient = { name: "Rice", protein: 4, carbs: 45, fats: 1 };
    const egg: Ingredient = {
      name: "Egg",
      protein: 6,
      carbs: 0.5,
      fats: 5,
      unit: "pcs",
    };

    expect(scaleIngredient(rice, 50, "g").carbs).toBe(22.5);
    expect(scaleIngredient(egg, 3, "pcs").protein).toBe(18);
  });
});

describe("calculateTotalsFromIngredients", () => {
  it("sums the macros rounded to one decimal", () => {
    expect(
      calculateTotalsFromIngredients([
        { name: "A", protein: 10.04, carbs: 1.11, fats: 0.33 },
        { name: "B", protein: 5.03, carbs: 2.22, fats: 0.33 },
      ]),
    ).toEqual({ protein: 15.1, carbs: 3.3, fats: 0.7 });
  });
});
