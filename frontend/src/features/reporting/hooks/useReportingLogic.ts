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
    const entryDateString =
      entry.entryDate || entry.createdAt?.split("T")[0] || "";
    if (!entryDateString) continue;

    const entryDate = new Date(`${entryDateString}T00:00:00`);
    if (entryDate < rangeStart || entryDate > rangeEnd) continue;

    if (!dailyTotals[entryDateString]) {
      dailyTotals[entryDateString] = {
        protein: 0,
        carbs: 0,
        fats: 0,
        calories: 0,
      };
    }

    dailyTotals[entryDateString].protein += entry.protein;
    dailyTotals[entryDateString].carbs += entry.carbs;
    dailyTotals[entryDateString].fats += entry.fats;
    dailyTotals[entryDateString].calories +=
      entry.protein * 4 + entry.carbs * 4 + entry.fats * 9;
  }

  const dailySeries = getDatesBetween(startDate, endDate).map((date) => ({
    name: formatDate(date),
    calories: dailyTotals[date]?.calories || 0,
    protein: dailyTotals[date]?.protein || 0,
    carbs: dailyTotals[date]?.carbs || 0,
    fats: dailyTotals[date]?.fats || 0,
  }));

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
      if (!weeklyTotals[weekKey]) {
        weeklyTotals[weekKey] = {
          totals: { protein: 0, carbs: 0, fats: 0, calories: 0 },
          count: 0,
        };
      }

      weeklyTotals[weekKey].totals.protein += totals.protein;
      weeklyTotals[weekKey].totals.carbs += totals.carbs;
      weeklyTotals[weekKey].totals.fats += totals.fats;
      weeklyTotals[weekKey].totals.calories += totals.calories;
      weeklyTotals[weekKey].count += 1;
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
    if (!monthlyTotals[monthKey]) {
      monthlyTotals[monthKey] = {
        totals: { protein: 0, carbs: 0, fats: 0, calories: 0 },
        count: 0,
      };
    }

    monthlyTotals[monthKey].totals.protein += totals.protein;
    monthlyTotals[monthKey].totals.carbs += totals.carbs;
    monthlyTotals[monthKey].totals.fats += totals.fats;
    monthlyTotals[monthKey].totals.calories += totals.calories;
    monthlyTotals[monthKey].count += 1;
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

  const dataProcessed = !isLoadingExternal;

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
    dataProcessed,
  };
}
