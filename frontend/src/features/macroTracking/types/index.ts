/**
 * Barrel file for macroTracking types
 * Re-export feature-specific types if any are defined locally.
 * If using app-wide types from "@/types/macro", re-export here for convenience to keep consumers on the feature API.
 */

// Example of local feature types re-export:
// export type { MacroLocalType } from "./MacroLocalTypes";

// Convenience re-exports from shared types (alphabetically sorted)
export type {
  MacroDailyTotals,
  MacroEntry,
  MealType,
} from "@/types/macro";