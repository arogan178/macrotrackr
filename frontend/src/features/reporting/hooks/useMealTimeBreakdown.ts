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

  // Determine unique tracked days in entries
  const uniqueDays = new Set(
    entries
      .map((entry) => entry.entryDate ?? entry.createdAt.split("T")[0])
      .filter(Boolean),
  ).size;
  const trackedDays = uniqueDays > 0 ? uniqueDays : 1;

  // Aggregate raw totals by meal type
  for (const entry of entries) {
    const mealType = entry.mealType;
    const group = groups[mealType];
    if (!group) continue;

    group.protein += entry.protein || 0;
    group.carbs += entry.carbs || 0;
    group.fats += entry.fats || 0;
    group.calories += calculateCalories(entry);
    group.count += 1;
  }

  // Calculate total across all meal types for percentage calculation
  const totalPeriodStat = MEAL_TYPES.reduce((sum, type) => {
    const group = groups[type];
    if (selectedStat === "count") return sum + group.count;

    return sum + (group[selectedStat as keyof typeof group] || 0);
  }, 0);

  // Format for chart
  return MEAL_TYPES.map((mealType) => {
    const group = groups[mealType];
    const totalStatForMeal =
      selectedStat === "count"
        ? group.count
        : group[selectedStat as keyof typeof group] || 0;

    const percentage =
      totalPeriodStat > 0
        ? Math.round((totalStatForMeal / totalPeriodStat) * 100)
        : 0;

    // For count, value is raw count; for nutrients/calories, value is daily average
    const value =
      selectedStat === "count"
        ? group.count
        : Math.round(totalStatForMeal / trackedDays);

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
