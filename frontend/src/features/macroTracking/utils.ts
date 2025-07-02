import { MacroEntry, MacroDailyTotals } from "./types";

// State management utilities
export interface OptimisticUpdateState {
  previousHistory: MacroEntry[];
  previousTotals: MacroDailyTotals;
}

// Create a snapshot of current state for rollback
export const createStateSnapshot = (
  history: MacroEntry[],
  totals: MacroDailyTotals
): OptimisticUpdateState => ({
  previousHistory: [...history],
  previousTotals: { ...totals },
});

// Create payload types for API calls
export interface AddEntryPayload {
  protein: number;
  carbs: number;
  fats: number;
  mealType: "breakfast" | "lunch" | "dinner" | "snack";
  mealName?: string;
  entry_date: string;
  entry_time: string;
}

export interface UpdateEntryPayload extends Partial<AddEntryPayload> {}

// Convert string inputs to numbers for API payload
export const createAddEntryPayload = (inputs: {
  protein: string;
  carbs: string;
  fats: string;
  mealType: string;
  mealName?: string;
  entry_date: string;
  entry_time: string;
}): AddEntryPayload => ({
  protein: parseFloat(inputs.protein) || 0,
  carbs: parseFloat(inputs.carbs) || 0,
  fats: parseFloat(inputs.fats) || 0,
  mealType: inputs.mealType as AddEntryPayload["mealType"],
  mealName: inputs.mealName,
  entry_date: inputs.entry_date,
  entry_time: inputs.entry_time,
});

// Format entry for display
export const formatEntryForDisplay = (entry: MacroEntry) => ({
  ...entry,
  displayCalories: Math.round(
    (entry.protein || 0) * 4 + (entry.carbs || 0) * 4 + (entry.fats || 0) * 9
  ),
  displayTime: formatTime(entry.entry_time),
  displayDate: formatDate(entry.entry_date),
});

// Time formatting utilities
export const formatTime = (time: string): string => {
  if (!time) return "";
  try {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  } catch {
    return time;
  }
};

export const formatDate = (date: string): string => {
  if (!date) return "";
  try {
    return new Date(date).toLocaleDateString();
  } catch {
    return date;
  }
};

// Generate current time string for entry
export const getCurrentTimeString = (): string => {
  const now = new Date();
  return now.toTimeString().split(" ")[0].substring(0, 5); // HH:MM format
};

// Check if two entries are the same (for duplicate detection)
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
