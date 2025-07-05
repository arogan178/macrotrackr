import { MacroEntry, MacroDailyTotals } from "@/types/macro";
import { CALORIES_PER_GRAM } from "@/utils/constants/nutrition";
import { DEFAULT_MACRO_TOTALS, getTodayDateString } from "./constants";

// Pure calculation functions
export const calculateCaloriesFromMacros = (
  protein: number,
  carbs: number,
  fats: number
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
    entry.fats || 0
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
  entries: MacroEntry[]
): MacroDailyTotals => {
  if (!entries || entries.length === 0) {
    return DEFAULT_MACRO_TOTALS;
  }

  return entries.reduce(
    (totals, entry) => ({
      protein: totals.protein + (entry.protein || 0),
      carbs: totals.carbs + (entry.carbs || 0),
      fats: totals.fats + (entry.fats || 0),
      calories: totals.calories + calculateEntryCalories(entry),
    }),
    { ...DEFAULT_MACRO_TOTALS }
  );
};

// Get entries for today
export const getTodayEntries = (entries: MacroEntry[]): MacroEntry[] => {
  const today = getTodayDateString();
  return entries.filter((entry) => {
    const entryDate =
      entry.entryDate || entry.entry_date || entry.created_at.split("T")[0];
    return entryDate === today;
  });
};

// Calculate today's totals from all entries
export const calculateTodayTotals = (
  allEntries: MacroEntry[]
): MacroDailyTotals => {
  const todayEntries = getTodayEntries(allEntries);
  return calculateDailyTotals(todayEntries);
};

// Update an entry in the entries array
export const updateEntryInList = (
  entries: MacroEntry[],
  id: number,
  updates: Partial<MacroEntry>
): MacroEntry[] => {
  return entries.map((entry) =>
    entry.id === id ? { ...entry, ...updates } : entry
  );
};

// Remove an entry from the entries array
export const removeEntryFromList = (
  entries: MacroEntry[],
  id: number
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
  fats: string
): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};

  const proteinNum = parseFloat(protein);
  const carbsNum = parseFloat(carbs);
  const fatsNum = parseFloat(fats);

  if (isNaN(proteinNum) || proteinNum < 0) {
    errors.protein = "Protein must be a valid positive number";
  }
  if (isNaN(carbsNum) || carbsNum < 0) {
    errors.carbs = "Carbs must be a valid positive number";
  }
  if (isNaN(fatsNum) || fatsNum < 0) {
    errors.fats = "Fats must be a valid positive number";
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
