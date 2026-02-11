// Macro percentage keys for consistent use across the app
import type { MacroTargetState } from "@/types/macro";

// Re-export MACRO_COLORS from centralized chart colors
export { MACRO_COLORS } from "@/utils/chartColors";

export const MACRO_PERCENTAGE_KEYS = [
  "proteinPercentage",
  "carbsPercentage",
  "fatsPercentage",
] as const;

export const DEFAULT_MACRO_TARGET: MacroTargetState = {
  proteinPercentage: 30,
  carbsPercentage: 40,
  fatsPercentage: 30,
  lockedMacros: [],
};
