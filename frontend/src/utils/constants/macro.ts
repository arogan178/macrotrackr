import type { MacroTargetState } from "@/types/macro";

export const DEFAULT_MACRO_TARGET: MacroTargetState = {
  proteinPercentage: 30,
  carbsPercentage: 40,
  fatsPercentage: 30,
  lockedMacros: [],
};

export const MACRO_COLORS = {
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
