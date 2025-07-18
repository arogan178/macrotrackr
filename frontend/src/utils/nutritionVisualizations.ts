// filepath: frontend/src/utils/nutrition-visualization.ts
// Shared utilities for nutrition visualizations (MealTimeBreakdown, MacroDensityBreakdown)

export const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export const MEAL_COLORS = {
  breakfast: {
    base: "#60a5fa", // blue-400
    gradient: ["#3b82f6", "#60a5fa"] as [string, string],
  },
  lunch: {
    base: "#34d399", // green-400
    gradient: ["#10b981", "#34d399"] as [string, string],
  },
  dinner: {
    base: "#f87171", // red-400
    gradient: ["#ef4444", "#f87171"] as [string, string],
  },
  snack: {
    base: "#a78bfa", // purple-400
    gradient: ["#8b5cf6", "#a78bfa"] as [string, string],
  },
};

export const MACRO_COLORS = {
  protein: {
    base: "#34d399", // green-400
    gradient: ["#10b981", "#34d399"] as [string, string],
  },
  carbs: {
    base: "#60a5fa", // blue-400
    gradient: ["#3b82f6", "#60a5fa"] as [string, string],
  },
  fats: {
    base: "#f87171", // red-400
    gradient: ["#ef4444", "#f87171"] as [string, string],
  },
};

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
