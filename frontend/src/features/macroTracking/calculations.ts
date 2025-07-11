import { MacroDailyTotals, MacroEntry } from "@/types/macro";
import { CALORIES_PER_GRAM } from "@/utils/constants/nutrition";

import { DEFAULT_MACRO_TOTALS, getTodayDateString } from "./constants";

// Pure calculation functions
export const calculateCaloriesFromMacros = (
  protein: number,
  carbs: number,
  fats: number,
): number => {
  return (
    protein * CALORIES_PER_GRAM.protein +
    carbs * CALORIES_PER_GRAM.carbs +
    fats * CALORIES_PER_GRAM.fats
  );
};

export const calculateEntryCalories = (entry: MacroEntry): number => {
  return calculateCaloriesFromMacros(
    entry.protein || 0,
    entry.carbs || 0,
    entry.fats || 0,
  );
};

export const calculateProteinCalories = (protein: number): number => {
  return Math.round(protein * CALORIES_PER_GRAM.protein);
};
export const calculateCarbsCalories = (carbs: number): number => {
  return carbs * CALORIES_PER_GRAM.carbs;
};
export const calculateFatsCalories = (fats: number): number => {
  return fats * CALORIES_PER_GRAM.fats;
};
// Calculate daily totals from entries
export const calculateDailyTotals = (
  entries: MacroEntry[],
): MacroDailyTotals => {
  if (!entries || entries.length === 0) {
    return DEFAULT_MACRO_TOTALS;
  }

  const totals: MacroDailyTotals = { ...DEFAULT_MACRO_TOTALS };
  for (const entry of entries) {
    totals.protein += entry.protein || 0;
    totals.carbs += entry.carbs || 0;
    totals.fats += entry.fats || 0;
    totals.calories += calculateEntryCalories(entry);
  }
  return totals;
};

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
