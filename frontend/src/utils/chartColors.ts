// Shared color definitions for charts
export interface ColorGradient {
  base: string;
  gradient: [string, string];
}

export interface ColorPalette {
  [key: string]: ColorGradient;
}

// Macro color palette — the same three hues the tokens declare, so a chart
// series and its legend chip cannot drift apart. No macro is green: green is
// the product.
export const MACRO_COLORS: ColorPalette = {
  protein: {
    base: "#a78bfa", // --color-protein
    gradient: ["#8b5cf6", "#a78bfa"],
  },
  carbs: {
    base: "#60a5fa", // --color-carbs
    gradient: ["#3b82f6", "#60a5fa"],
  },
  fats: {
    base: "#f97316", // --color-fats
    gradient: ["#ea580c", "#f97316"],
  },
};

// Meal type color palette
export const MEAL_COLORS: ColorPalette = {
  breakfast: {
    base: "#60a5fa", // blue-400
    gradient: ["#3b82f6", "#60a5fa"],
  },
  lunch: {
    base: "#34d399", // green-400
    gradient: ["#10b981", "#34d399"],
  },
  dinner: {
    base: "#f87171", // red-400
    gradient: ["#ef4444", "#f87171"],
  },
  snack: {
    base: "#a78bfa", // purple-400
    gradient: ["#8b5cf6", "#a78bfa"],
  },
};

// Stat type color mapping
// Five identical greens told the reader nothing. Calories are the live value,
// so they keep the brand colour; the macros carry their own.
export const STAT_COLORS = {
  calories: "bg-primary",
  protein: "bg-protein",
  carbs: "bg-carbs",
  fats: "bg-fats",
  count: "bg-surface-3",
};

// Get unit based on stat type
export function getUnitForStat(statType: string): string {
  switch (statType) {
    case "calories": {
      return "kcal";
    }
    case "protein":
    case "carbs":
    case "fats": {
      return "g";
    }
    default: {
      return "";
    }
  }
}
