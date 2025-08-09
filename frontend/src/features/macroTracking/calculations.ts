import type { MacroDailyTotals, MacroEntry } from "@/types/macro";
// Import calculateDailyTotals for local use
import { calculateDailyTotals } from "@/utils/nutritionCalculations";

import { getTodayDateString } from "./constants";

// Re-export consolidated nutrition calculations (match exact exported names)
export {
  caloriesFromMacrosRaw as calculateCaloriesFromMacros,
  caloriesFromEntryRaw as calculateEntryCalories,
} from "@/utils/nutritionCalculations";

// Import helpers directly for consumers that import from this module
export {
  calculateCarbsCalories,
  calculateFatsCalories,
  calculateProteinCalories,
} from "@/utils/nutritionCalculations";

/**
 * Get entries for today (date-scoped selection helper for aggregation)
 */
export const getTodayEntries = (entries: MacroEntry[]): MacroEntry[] => {
  const today = getTodayDateString();
  return entries.filter((entry) => {
    const entryDate = entry.entryDate || entry.createdAt?.split("T")[0];
    return entryDate === today;
  });
};

/**
 * Calculate today's totals from all entries (aggregation orchestration)
 */
export const calculateTodayTotals = (
  allEntries: MacroEntry[],
): MacroDailyTotals => {
  const todayEntries = getTodayEntries(allEntries);
  return calculateDailyTotals(todayEntries);
};
