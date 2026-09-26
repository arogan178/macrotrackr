import type { Ingredient } from "@/types/macro";

import { UnitConverter, type UnitType } from "./units";

export const roundValue = (value: number) => Number(value.toFixed(1));

const isPieceUnit = (unit?: string) =>
  unit === "unit" ||
  unit === "pcs" ||
  unit === "pc" ||
  unit === "piece" ||
  unit === "pieces";

export const calculateTotalsFromIngredients = (ingredients: Ingredient[]) => {
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFats = 0;

  for (const ingredient of ingredients) {
    totalProtein += ingredient.protein || 0;
    totalCarbs += ingredient.carbs || 0;
    totalFats += ingredient.fats || 0;
  }

  return {
    protein: Number(totalProtein.toFixed(1)),
    carbs: Number(totalCarbs.toFixed(1)),
    fats: Number(totalFats.toFixed(1)),
  };
};

export const getGramsEquivalent = (
  quantity: number | undefined,
  unit: string | undefined,
): number => {
  if (!quantity || quantity <= 0) return 0;
  const unitString =
    unit === "l"
      ? "L"
      : unit === "pcs" || unit === "pc" || unit === "piece" || unit === "pieces"
        ? "unit"
        : unit ?? "g";

  if (unitString === "unit") {
    return quantity * 100;
  }

  if (UnitConverter.isWeightUnit(unitString as UnitType)) {
    return UnitConverter.convert(quantity, unitString as UnitType, "g");
  }

  if (UnitConverter.isVolumeUnit(unitString as UnitType)) {
    return UnitConverter.convert(quantity, unitString as UnitType, "ml");
  }

  return quantity * 100;
};

/**
 * Sets an ingredient's quantity and unit and rescales its macros from its base
 * values, falling back to its current values when it has no base.
 */
export const scaleIngredient = (
  ingredient: Ingredient,
  quantity: number | undefined,
  unit: string | undefined,
): Ingredient => {
  const defaultBase = isPieceUnit(ingredient.unit) ? 1 : 100;
  const baseQuantity =
    ingredient.baseQuantity ?? ingredient.quantity ?? defaultBase;
  const baseUnit = ingredient.baseUnit ?? ingredient.unit ?? "g";

  const baseGrams = getGramsEquivalent(baseQuantity, baseUnit);
  const targetGrams = getGramsEquivalent(
    quantity ?? (isPieceUnit(unit) ? 1 : 100),
    unit ?? "g",
  );
  const factor = baseGrams > 0 ? targetGrams / baseGrams : 1;

  return {
    ...ingredient,
    quantity,
    unit,
    protein: roundValue((ingredient.baseProtein ?? ingredient.protein) * factor),
    carbs: roundValue((ingredient.baseCarbs ?? ingredient.carbs) * factor),
    fats: roundValue((ingredient.baseFats ?? ingredient.fats) * factor),
  };
};
