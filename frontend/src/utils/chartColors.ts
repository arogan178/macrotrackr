// Shared color definitions for charts
export interface ColorGradient {
  base: string;
  gradient: [string, string];
}

export interface ColorPalette {
  [key: string]: ColorGradient;
}

// Macro color palette
export const MACRO_COLORS: ColorPalette = {
  protein: {
    base: "#34d399", // green-400
    gradient: ["#10b981", "#34d399"],
  },
  carbs: {
    base: "#60a5fa", // blue-400
    gradient: ["#3b82f6", "#60a5fa"],
  },
  fats: {
    base: "#f87171", // red-400
    gradient: ["#ef4444", "#f87171"],
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
export const STAT_COLORS = {
  calories: "bg-primary",
  protein: "bg-success",
  carbs: "bg-primary",
  fats: "bg-error",
  count: "bg-purple-600",
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
