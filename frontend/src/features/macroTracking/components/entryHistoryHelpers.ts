import type { MacroEntry } from "@/types/macro";

export const formatEntryDate = (dateString: string): string =>
  new Date(dateString).toLocaleDateString("en-UK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export const formatTimeFromEntry = (entry: MacroEntry): string =>
  entry.entryTime ||
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
