import { useMemo } from "react";

import { MacroEntry } from "@/types/macro";

import {
  getDateRangeData,
  getDayString,
  getMonthString,
  getWeekString,
} from "../utils";

/**
 * Custom hook to compute macro density breakdown (grouped by day/week/month) for charting.
 * @param history Array of MacroEntry
 * @param dateRange "week" | "month" | "3months"
 * @returns Array of grouped macro density data for charting
 *
 * Usage:
 *   const macroDensityData = useMacroDensityBreakdown(history, dateRange);
 */
export function useMacroDensityBreakdown(
  history: MacroEntry[] | undefined,
  dateRange: string,
) {
  return useMemo(() => {
    if (!history || history.length === 0) {
      return [];
    }
    const { startDate: startDateString, endDate: endDateString } =
      getDateRangeData(dateRange);
    const startDate = new Date(startDateString + "T00:00:00");
    const endDate = new Date(endDateString + "T23:59:59");

    // Group by day/week/month based on range
    let groupKeyFunction: (date: Date) => string;
    let labelFunction: (key: string, groupDates?: Date[]) => string;
    if (dateRange === "week") {
      groupKeyFunction = getDayString;
      labelFunction = (key) => {
        const d = new Date(key + "T00:00:00");
        return d.toLocaleString("en-US", { month: "short", day: "numeric" });
      };
    } else if (dateRange === "month") {
      groupKeyFunction = getWeekString;
      labelFunction = (key, groupDates) => {
        if (!groupDates || groupDates.length === 0) return key;
        const sorted = groupDates.sort((a, b) => a.getTime() - b.getTime());
        const start = sorted[0];
        const end = sorted.at(-1);
        return `${start.toLocaleString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleString("en-US", { month: "short", day: "numeric" })}`;
      };
    } else {
      groupKeyFunction = getMonthString;
      labelFunction = (key) => {
        const [year, month] = key.split("-");
        const d = new Date(Number(year), Number(month) - 1, 1);
        return d.toLocaleString("en-US", { month: "short" });
      };
    }

    // Group entries and collect dates for week ranges
    const grouped: Record<
      string,
      {
        protein: number;
        carbs: number;
        fats: number;
        calories: number;
        count: number;
        dates: Date[];
      }
    > = {};
    for (const entry of history) {
      let entryDateString: string;
      if (entry.entryDate) {
        entryDateString = entry.entryDate;
      } else if (entry.createdAt) {
        const createdAtDate = new Date(entry.createdAt);
        entryDateString = `${createdAtDate.getFullYear()}-${(
          createdAtDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${createdAtDate
          .getDate()
          .toString()
          .padStart(2, "0")}`;
      } else {
        continue;
      }
      const entryDate = new Date(entryDateString + "T00:00:00");
      if (entryDate < startDate || entryDate > endDate) continue;
      const groupKey = groupKeyFunction(entryDate);
      if (!grouped[groupKey]) {
        grouped[groupKey] = {
          protein: 0,
          carbs: 0,
          fats: 0,
          calories: 0,
          count: 0,
          dates: [],
        };
      }
      grouped[groupKey].protein += entry.protein;
      grouped[groupKey].carbs += entry.carbs;
      grouped[groupKey].fats += entry.fats;
      grouped[groupKey].calories +=
        entry.protein * 4 + entry.carbs * 4 + entry.fats * 9;
      grouped[groupKey].count += 1;
      grouped[groupKey].dates.push(entryDate);
    }

    // Convert to array and calculate percentages
    return Object.entries(grouped)
      .sort(([a], [b]) => (a < b ? 1 : -1)) // Descending by group
      .map(([key, macros]) => {
        const total = macros.protein + macros.carbs + macros.fats;
        return {
          period: labelFunction(key, macros.dates),
          calories: macros.calories,
          protein: total > 0 ? macros.protein / total : 0,
          carbs: total > 0 ? macros.carbs / total : 0,
          fats: total > 0 ? macros.fats / total : 0,
          count: macros.count,
        };
      });
  }, [history, dateRange]);
}
