/**
 * Macro Tracking Utilities
 * List operations, formatting, validation, and state helpers
 */

import { MacroDailyTotals, MacroEntry, MealType } from "@/types/macro";

// Re-export unit utilities
export * from "./historyExport";
export * from "./units";

// State management utilities
export interface OptimisticUpdateState {
  previousHistory: MacroEntry[];
  previousTotals: MacroDailyTotals;
}

// API payload types for macro entry operations
export interface AddEntryPayload {
  protein: number;
  carbs: number;
  fats: number;
  mealType: MealType;
  mealName: string;
  entryDate: string;
  entryTime: string;
}

export type UpdateEntryPayload = Partial<AddEntryPayload>;

export const createStateSnapshot = (
  history: MacroEntry[],
  totals: MacroDailyTotals,
): OptimisticUpdateState => ({
  previousHistory: [...history],
  previousTotals: { ...totals },
});

// Utility: Check if two entries are the same (for duplicate detection)
export const areEntriesSame = (
  entry1: MacroEntry,
  entry2: MacroEntry,
): boolean => {
  return (
    entry1.protein === entry2.protein &&
    entry1.carbs === entry2.carbs &&
    entry1.fats === entry2.fats &&
    entry1.mealType === entry2.mealType &&
    entry1.entryDate === entry2.entryDate &&
    entry1.entryTime === entry2.entryTime
  );
};

/**
 * List manipulation helpers
 */
export const updateEntryInList = (
  entries: MacroEntry[],
  id: number,
  updates: Partial<MacroEntry>,
): MacroEntry[] => {
  return entries.map((entry) =>
    entry.id === id ? { ...entry, ...updates } : entry,
  );
};

export const removeEntryFromList = (
  entries: MacroEntry[],
  id: number,
): MacroEntry[] => {
  return entries.filter((entry) => entry.id !== id);
};

/**
 * Formatting helpers
 */
export const formatMacroValue = (value: number): string => {
  return Math.round(value).toString();
};

/**
 * Validation helpers
 */
export const validateMacroInputs = (
  protein: string,
  carbs: string,
  fats: string,
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  const proteinNumber = Number.parseFloat(protein);
  const carbsNumber = Number.parseFloat(carbs);
  const fatsNumber = Number.parseFloat(fats);

  if (Number.isNaN(proteinNumber) || proteinNumber < 0) {
    errors.protein = "Protein must be a valid positive number";
  }
  if (Number.isNaN(carbsNumber) || carbsNumber < 0) {
    errors.carbs = "Carbs must be a valid positive number";
  }
  if (Number.isNaN(fatsNumber) || fatsNumber < 0) {
    errors.fats = "Fats must be a valid positive number";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
