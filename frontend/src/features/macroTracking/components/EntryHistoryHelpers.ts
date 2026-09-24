import type { MacroEntry } from "@/types/macro";
import { getDisplayDate } from "@/utils/dateUtilities";

export const formatEntryDate = (dateString: string): string => {
  if (!dateString) return "";
  const [year, month, day] = dateString.split("-").map(Number);
  // Built from parts so a YYYY-MM-DD string is read as a local date, not UTC.
  const date =
    year && month && day ? new Date(year, month - 1, day) : new Date(dateString);

  return getDisplayDate(date);
};

// Imported and older rows store HH:MM:SS; everything the app writes is HH:MM.
export const formatTimeFromEntry = (entry: MacroEntry): string =>
  entry.entryTime?.slice(0, 5) ||
  new Date(entry.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });

export const calculateCalories = (
  protein: number,
  carbs: number,
  fats: number,
): number => Math.round(protein * 4 + carbs * 4 + fats * 9);

export const capitalizeFirstLetter = (string: string): string =>
  string ? string.charAt(0).toUpperCase() + string.slice(1) : "";
