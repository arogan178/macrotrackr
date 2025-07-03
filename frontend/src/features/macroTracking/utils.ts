import { MacroEntry, MacroDailyTotals } from "@/types/macro";

// State management utilities
export interface OptimisticUpdateState {
  previousHistory: MacroEntry[];
  previousTotals: MacroDailyTotals;
}

export const createStateSnapshot = (
  history: MacroEntry[],
  totals: MacroDailyTotals
): OptimisticUpdateState => ({
  previousHistory: [...history],
  previousTotals: { ...totals },
});

// Utility: Check if two entries are the same (for duplicate detection)
export const areEntriesSame = (
  entry1: MacroEntry,
  entry2: MacroEntry
): boolean => {
  return (
    entry1.protein === entry2.protein &&
    entry1.carbs === entry2.carbs &&
    entry1.fats === entry2.fats &&
    entry1.mealType === entry2.mealType &&
    entry1.entry_date === entry2.entry_date &&
    entry1.entry_time === entry2.entry_time
  );
};
