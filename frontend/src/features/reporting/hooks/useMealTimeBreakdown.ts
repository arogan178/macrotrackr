import { useMemo } from "react";

import { formatMealType,MEAL_TYPES } from "@/utils/nutritionVisualizations";

import { getDayString } from "../utils";

// Re-export MealType from shared utilities
type MealType = (typeof MEAL_TYPES)[number];

export interface MacroEntry {
  id: number;
  protein: number;
  carbs: number;
  fats: number;
  mealType: MealType;
  mealName: string | undefined;
  entryDate?: string;
  entryTime?: string;
  createdAt: string;
}

export interface MealTypeDistributionData {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
  count: number;
  value: number;
  percentage: number;
}

const calculateCalories = (entry: MacroEntry) =>
  (entry.protein || 0) * 4 + (entry.carbs || 0) * 4 + (entry.fats || 0) * 9;

function calculateMealTypeDistribution(
  entries: MacroEntry[],
  selectedStat: string,
) {
  // Initialize groups
  const groups = Object.fromEntries(
    MEAL_TYPES.map((type) => [
      type,
      { calories: 0, protein: 0, carbs: 0, fats: 0, count: 0 },
    ]),
  );

  // Aggregate data by meal type
  for (const entry of entries) {
    const mealType = entry.mealType;
    const group = groups[mealType];

    group.protein += entry.protein || 0;
    group.carbs += entry.carbs || 0;
    group.fats += entry.fats || 0;
    group.calories += calculateCalories(entry);
    group.count += 1;
  }

  // Convert to averages for calories
  for (const group of Object.values(groups)) {
    group.calories = group.count > 0 ? group.calories / group.count : 0;
  }

  // Calculate totals for percentages
  const totals = { calories: 0, protein: 0, carbs: 0, fats: 0, count: 0 };
  for (const group of Object.values(groups)) {
    totals.calories += group.calories;
    totals.protein += group.protein;
    totals.carbs += group.carbs;
    totals.fats += group.fats;
    totals.count += group.count;
  }

  // Format for chart
  return MEAL_TYPES.map((mealType) => {
    const group = groups[mealType];
    const value = group[selectedStat as keyof typeof group];
    const total = totals[selectedStat as keyof typeof totals];
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

    return {
      name: formatMealType(mealType),
      ...group,
      value,
      percentage,
    };
  });
}

/**
 * Custom hook to filter macro history by date and calculate meal type distribution for charting.
 * @param history Array of MacroEntry
 * @param startDate ISO string (YYYY-MM-DD)
 * @param endDate ISO string (YYYY-MM-DD)
 * @param selectedStat Stat to aggregate ("calories", "protein", etc.)
 * @returns Array of MealTypeDistributionData
 *
 * Usage:
 *   const mealTypeDistribution = useMealTimeBreakdown(history, startDate, endDate, selectedStat);
 */
export function useMealTimeBreakdown(
  history: MacroEntry[],
  startDate: string,
  endDate: string,
  selectedStat: string,
): MealTypeDistributionData[] {
  // Filter history by date range
  const filteredHistory = useMemo(() => {
    if (!history.length) return [];
    // Use shared getDayString for normalization, but direct start/end for filtering
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T23:59:59");

    return history.filter((entry) => {
      const dateString = entry.entryDate ?? entry.createdAt.split("T")[0];
      if (!dateString) return false;
      // Use shared getDayString for normalization
      const entryDate = new Date(
        getDayString(new Date(dateString)) + "T12:00:00",
      );

      return entryDate >= start && entryDate <= end;
    });
  }, [history, startDate, endDate]);

  // Calculate distribution
  return useMemo(
    () =>
      filteredHistory.length > 0
        ? calculateMealTypeDistribution(filteredHistory, selectedStat)
        : [],
    [filteredHistory, selectedStat],
  );
}
