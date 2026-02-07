// filepath: frontend/src/utils/nutrition-visualization.ts
// Shared utilities for nutrition visualizations (MealTimeBreakdown, MacroDensityBreakdown)

// Re-export colors from centralized chart colors to avoid duplication
export { MACRO_COLORS, MEAL_COLORS } from "./chartColors";

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export function formatMealType(mealType: string): string {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

export function getMacroPercentages({
  protein,
  carbs,
  fats,
  calories,
}: {
  protein: number;
  carbs: number;
  fats: number;
  calories: number;
}) {
  if (calories === 0) return { proteinPct: 0, carbsPct: 0, fatsPct: 0 };
  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatsCals = fats * 9;
  const totalMacroCals = proteinCals + carbsCals + fatsCals;
  if (totalMacroCals === 0) return { proteinPct: 0, carbsPct: 0, fatsPct: 0 };
  const proteinPctExact = (proteinCals / totalMacroCals) * 100;
  const carbsPctExact = (carbsCals / totalMacroCals) * 100;
  let pOut = Math.round(proteinPctExact);
  let cOut = Math.round(carbsPctExact);
  let fOut = 100 - pOut - cOut;
  if (fOut < 0) {
    fOut = 0;
    const excessSum = pOut + cOut - 100;
    if (pOut + cOut > 0) {
      const pReduction = Math.round(excessSum * (pOut / (pOut + cOut)));
      const cReduction = excessSum - pReduction;
      pOut -= pReduction;
      cOut -= cReduction;
    } else {
      pOut = 50;
      cOut = 50;
    }
    pOut = Math.max(0, pOut);
    cOut = Math.max(0, cOut);
    fOut = 100 - pOut - cOut;
  }
  pOut = Math.max(0, pOut);
  cOut = Math.max(0, cOut);
  fOut = Math.max(0, fOut);
  const finalSum = pOut + cOut + fOut;
  if (finalSum !== 100 && totalMacroCals > 0) {
    fOut += 100 - finalSum;
  }
  fOut = Math.max(0, fOut);
  const checkSum = pOut + cOut + fOut;
  if (checkSum !== 100) {
    fOut = 100 - pOut - cOut;
  }
  return { proteinPct: pOut, carbsPct: cOut, fatsPct: Math.max(0, fOut) };
}
