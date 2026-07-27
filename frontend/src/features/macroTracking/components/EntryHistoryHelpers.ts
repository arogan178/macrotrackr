import type { MacroEntry } from "@/types/macro";

export const formatEntryDate = (dateString: string): string => {
  if (!dateString) return "";
  const parts = dateString.split("-");
  if (parts.length === 3) {
    const year = Number.parseInt(parts[0], 10);
    const month = Number.parseInt(parts[1], 10) - 1;
    const day = Number.parseInt(parts[2], 10);
    if (!Number.isNaN(year) && !Number.isNaN(month) && !Number.isNaN(day)) {
      return new Date(year, month, day).toLocaleDateString("en-UK", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    }
  }
  return new Date(dateString).toLocaleDateString("en-UK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

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
