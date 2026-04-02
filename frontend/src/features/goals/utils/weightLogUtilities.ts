import { formatISO } from "date-fns";

import type { AddWeightLogPayload, WeightLogEntry } from "@/api/goals";

// Weight log data utilities
export function createWeightLogEntry(
  weight: number,
  date?: string,
): AddWeightLogPayload {
  const entryDate = date ?? new Date().toISOString().split("T")[0];

  return {
    weight,
    timestamp: formatISO(new Date(entryDate)),
  };
}

// Weight log sorting and filtering utilities
export function sortWeightLogByDate(
  entries: WeightLogEntry[],
): WeightLogEntry[] {
  return [...entries].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export function filterWeightLogByDateRange(
  entries: WeightLogEntry[],
  startDate: string,
  endDate: string,
): WeightLogEntry[] {
  const start = new Date(startDate);
  const end = new Date(endDate);

  return entries.filter((entry) => {
    const entryDate = new Date(entry.timestamp);

    return entryDate >= start && entryDate <= end;
  });
}

export function getLastNEntries(
  entries: WeightLogEntry[],
  count: number,
): WeightLogEntry[] {
  const sorted = sortWeightLogByDate(entries);

  return sorted.slice(0, count);
}

// Weight trend analysis utilities
export function calculateWeightTrend(
  entries: WeightLogEntry[],
  days = 7,
): {
  trend: "up" | "down" | "stable";
  change: number;
  averageChange: number;
} {
  const recent = getLastNEntries(entries, days);

  if (recent.length < 2) {
    return { trend: "stable", change: 0, averageChange: 0 };
  }

  const latest = recent[0].weight;
  const oldest = recent.at(-1).weight;
  const change = latest - oldest;
  const averageChange = change / (recent.length - 1);

  let trend: "up" | "down" | "stable" = "stable";
  if (Math.abs(change) > 0.1) {
    trend = change > 0 ? "up" : "down";
  }

  return {
    trend,
    change: Math.round(change * 10) / 10,
    averageChange: Math.round(averageChange * 10) / 10,
  };
}

export function calculateWeightAverage(
  entries: WeightLogEntry[],
  days = 7,
): number {
  const recent = getLastNEntries(entries, days);

  if (recent.length === 0) return 0;

  const sum = recent.reduce((total, entry) => total + entry.weight, 0);

  return Math.round((sum / recent.length) * 10) / 10;
}

export function getWeightChangeFromStart(
  entries: WeightLogEntry[],
  startingWeight: number,
): {
  totalChange: number;
  latestWeight: number;
} {
  if (entries.length === 0) {
    return { totalChange: 0, latestWeight: startingWeight };
  }

  const sorted = sortWeightLogByDate(entries);
  const latestWeight = sorted[0].weight;
  const totalChange = latestWeight - startingWeight;

  return {
    totalChange: Math.round(totalChange * 10) / 10,
    latestWeight: Math.round(latestWeight * 10) / 10,
  };
}

// Weight log validation utilities
export function validateWeightEntry(weight: number, date?: string): string[] {
  const errors: string[] = [];

  if (!weight || weight <= 0) {
    errors.push("Weight must be greater than 0");
  }

  if (weight > 1000) {
    errors.push("Weight seems unrealistic (over 1000)");
  }

  if (date) {
    const entryDate = new Date(date);
    const today = new Date();

    if (entryDate > today) {
      errors.push("Weight entry cannot be in the future");
    }

    // Check if date is too far in the past (more than 2 years)
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(today.getFullYear() - 2);

    if (entryDate < twoYearsAgo) {
      errors.push("Weight entry cannot be more than 2 years old");
    }
  }

  return errors;
}

export function isValidWeightEntry(weight: number, date?: string): boolean {
  return validateWeightEntry(weight, date).length === 0;
}

// Weight log statistics
export function getWeightLogStats(entries: WeightLogEntry[]) {
  if (entries.length === 0) {
    return {
      totalEntries: 0,
      averageWeight: 0,
      minWeight: 0,
      maxWeight: 0,
      weightRange: 0,
      firstEntry: undefined,
      lastEntry: undefined,
    };
  }

  const sorted = sortWeightLogByDate(entries);
  const weights = entries.map((entry) => entry.weight);
  const sum = weights.reduce((total, weight) => total + weight, 0);
  const minWeight = Math.min(...weights);
  const maxWeight = Math.max(...weights);

  return {
    totalEntries: entries.length,
    averageWeight: Math.round((sum / entries.length) * 10) / 10,
    minWeight: Math.round(minWeight * 10) / 10,
    maxWeight: Math.round(maxWeight * 10) / 10,
    weightRange: Math.round((maxWeight - minWeight) * 10) / 10,
    firstEntry: sorted.at(-1),
    lastEntry: sorted[0],
  };
}
