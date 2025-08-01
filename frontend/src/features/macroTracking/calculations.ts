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

// Get entries for today
export const getTodayEntries = (entries: MacroEntry[]): MacroEntry[] => {
  const today = getTodayDateString();
  return entries.filter((entry) => {
    const entryDate = entry.entryDate || entry.createdAt?.split("T")[0];
    return entryDate === today;
  });
};

// Calculate today's totals from all entries
export const calculateTodayTotals = (
  allEntries: MacroEntry[],
): MacroDailyTotals => {
  const todayEntries = getTodayEntries(allEntries);
  return calculateDailyTotals(todayEntries);
};

// Update an entry in the entries array
export const updateEntryInList = (
  entries: MacroEntry[],
  id: number,
  updates: Partial<MacroEntry>,
): MacroEntry[] => {
  return entries.map((entry) =>
    entry.id === id ? { ...entry, ...updates } : entry,
  );
};

// Remove an entry from the entries array
export const removeEntryFromList = (
  entries: MacroEntry[],
  id: number,
): MacroEntry[] => {
  return entries.filter((entry) => entry.id !== id);
};

// Format macro values for display
export const formatMacroValue = (value: number): string => {
  return Math.round(value).toString();
};

// Validate macro input values
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
