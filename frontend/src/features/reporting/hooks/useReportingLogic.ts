import { useCallback, useMemo } from "react";

import type { MacroEntry } from "@/types/macro";

import {
  formatDate,
  getDateRangeData,
  getDatesBetween,
  getMonthString,
  getWeekString,
} from "../utils";

interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface ReportingChartRow extends MacroTotals {
  name: string;
  [key: string]: string | number;
}

function buildReportingData(
  history: MacroEntry[] | undefined,
  dateRange: string,
): {
  aggregatedData: ReportingChartRow[];
  dailySeries: ReportingChartRow[];
} {
  if (!history?.length) {
    return {
      aggregatedData: [],
      dailySeries: [],
    };
  }

  const { startDate, endDate } = getDateRangeData(dateRange);
  const rangeStart = new Date(`${startDate}T00:00:00`);
  const rangeEnd = new Date(`${endDate}T23:59:59`);
  const dailyTotals: Record<string, MacroTotals> = {};

  for (const entry of history) {
    const entryDateString = entry.entryDate;

    const entryDate = new Date(`${entryDateString}T00:00:00`);
    if (entryDate < rangeStart || entryDate > rangeEnd) continue;

    let totals = dailyTotals[entryDateString];
    if (!totals) {
      totals = {
        protein: 0,
        carbs: 0,
        fats: 0,
        calories: 0,
      };
      dailyTotals[entryDateString] = totals;
    }

    totals.protein += entry.protein;
    totals.carbs += entry.carbs;
    totals.fats += entry.fats;
    totals.calories +=
      entry.protein * 4 + entry.carbs * 4 + entry.fats * 9;
  }

  const dailySeries = getDatesBetween(startDate, endDate).map((date) => {
    const totals = dailyTotals[date];

    return {
      name: formatDate(date),
      calories: totals ? totals.calories : 0,
      protein: totals ? totals.protein : 0,
      carbs: totals ? totals.carbs : 0,
      fats: totals ? totals.fats : 0,
    };
  });

  if (dateRange === "week") {
    return {
      aggregatedData: dailySeries,
      dailySeries,
    };
  }

  if (dateRange === "month") {
    const weeklyTotals: Record<string, { totals: MacroTotals; count: number }> =
      {};

    for (const [dateString, totals] of Object.entries(dailyTotals)) {
      const weekKey = getWeekString(new Date(`${dateString}T00:00:00`));
      const existing = weeklyTotals[weekKey];
      if (!existing) {
        weeklyTotals[weekKey] = {
          totals: { protein: 0, carbs: 0, fats: 0, calories: 0 },
          count: 0,
        };
      }

      const week = weeklyTotals[weekKey];
      week.totals.protein += totals.protein;
      week.totals.carbs += totals.carbs;
      week.totals.fats += totals.fats;
      week.totals.calories += totals.calories;
      week.count += 1;
    }

    return {
      aggregatedData: Object.entries(weeklyTotals)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([weekKey, { totals, count }]) => ({
          name: `Week ${weekKey.split("-W")[1]}`,
          calories: count > 0 ? Math.round(totals.calories / count) : 0,
          protein: count > 0 ? Math.round(totals.protein / count) : 0,
          carbs: count > 0 ? Math.round(totals.carbs / count) : 0,
          fats: count > 0 ? Math.round(totals.fats / count) : 0,
        })),
      dailySeries,
    };
  }

  const monthlyTotals: Record<string, { totals: MacroTotals; count: number }> =
    {};

  for (const [dateString, totals] of Object.entries(dailyTotals)) {
    const monthKey = getMonthString(new Date(`${dateString}T00:00:00`));
    const existing = monthlyTotals[monthKey];
    if (!existing) {
      monthlyTotals[monthKey] = {
        totals: { protein: 0, carbs: 0, fats: 0, calories: 0 },
        count: 0,
      };
    }

    const month = monthlyTotals[monthKey];
    month.totals.protein += totals.protein;
    month.totals.carbs += totals.carbs;
    month.totals.fats += totals.fats;
    month.totals.calories += totals.calories;
    month.count += 1;
  }

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  return {
    aggregatedData: Object.entries(monthlyTotals)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([monthKey, { totals, count }]) => {
        const [year, month] = monthKey.split("-");

        return {
          name: `${monthNames[Number.parseInt(month, 10) - 1]} ${year}`,
          calories: count > 0 ? Math.round(totals.calories / count) : 0,
          protein: count > 0 ? Math.round(totals.protein / count) : 0,
          carbs: count > 0 ? Math.round(totals.carbs / count) : 0,
          fats: count > 0 ? Math.round(totals.fats / count) : 0,
        };
      }),
    dailySeries,
  };
}

export function useReportingLogic(
  history: MacroEntry[] | undefined,
  dateRange: string,
  isLoadingExternal: boolean,
) {
  const { aggregatedData, dailySeries } = useMemo(
    () => buildReportingData(history, dateRange),
    [dateRange, history],
  );

  const isHistoryReady = !isLoadingExternal;

  const averages = useMemo(() => {
    if (aggregatedData.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    }

    const totals = { calories: 0, protein: 0, carbs: 0, fats: 0 };

    for (const value of aggregatedData) {
      totals.calories += value.calories;
      totals.protein += value.protein;
      totals.carbs += value.carbs;
      totals.fats += value.fats;
    }

    return {
      calories: Math.round(totals.calories / aggregatedData.length),
      protein: Math.round(totals.protein / aggregatedData.length),
      carbs: Math.round(totals.carbs / aggregatedData.length),
      fats: Math.round(totals.fats / aggregatedData.length),
    };
  }, [aggregatedData]);

  const handleDownloadCSV = useCallback(() => {
    if (aggregatedData.length === 0) {
      return;
    }

    const csvContent = [
      "Period,Calories,Protein,Carbs,Fats",
      ...aggregatedData.map(
        (item) =>
          `${item.name},${item.calories},${item.protein},${item.carbs},${item.fats}`,
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `nutrition-data-${dateRange}.csv`;
    link.style.visibility = "hidden";
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }, [aggregatedData, dateRange]);

  return {
    aggregatedData,
    dailySeries,
    averages,
    handleDownloadCSV,
    isHistoryReady,
  };
}
