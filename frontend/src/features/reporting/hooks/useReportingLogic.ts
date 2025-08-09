// --- Shared helpers for reporting breakdowns ---
import { useCallback, useEffect, useMemo, useState } from "react";

import { MacroEntry } from "@/types/macro";

import { formatDate } from "../utils";

export function getDateRangeISOStrings(range: string): {
  startDate: string;
  endDate: string;
} {
  const today = new Date();
  const endDateString = today.toISOString().split("T")[0];
  let days = 7;
  if (range === "month") days = 30;
  if (range === "3months") days = 90;
  const startDateObject = new Date(today);
  startDateObject.setDate(today.getDate() - (days - 1));
  const startDateString = startDateObject.toISOString().split("T")[0];
  return { startDate: startDateString, endDate: endDateString };
}

export function getDayString(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
}

export function getWeekString(date: Date) {
  const year = date.getFullYear();
  const firstDay = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDay.getTime()) / 86_400_000;
  const week = Math.ceil((pastDaysOfYear + firstDay.getDay() + 1) / 7);
  return `${year}-W${week.toString().padStart(2, "0")}`;
}

export function getMonthString(date: Date) {
  return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}`;
}

interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export function useReportingLogic(
  history: MacroEntry[] | undefined,
  dateRange: string,
  isLoadingExternal: boolean, // To know if history is loading vs. empty
) {
  const [aggregatedData, setAggregatedData] = useState<
    {
      name: string; // Recharts uses 'name' for the x-axis label
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    }[]
  >([]);
  const [dataProcessed, setDataProcessed] = useState(false);

  const [dailySeries, setDailySeries] = useState<
    {
      name: string;
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    }[]
  >([]);

  const mapDateRangeToNumeric = useCallback((range: string): 7 | 30 | 90 => {
    switch (range) {
      case "week": {
        return 7;
      }
      case "month": {
        return 30;
      }
      case "3months": {
        return 90;
      }
      default: {
        return 7;
      }
    }
  }, []);

  const getDateRangeISOStrings = useCallback(
    (range: string): { startDate: string; endDate: string } => {
      const today = new Date();
      const endDateString = today.toISOString().split("T")[0];
      const days = mapDateRangeToNumeric(range);
      const startDateObject = new Date(today);
      startDateObject.setDate(today.getDate() - (days - 1));
      const startDateString = startDateObject.toISOString().split("T")[0];
      return { startDate: startDateString, endDate: endDateString };
    },
    [mapDateRangeToNumeric],
  );

  const processDataForCharts = useCallback(
    (currentHistory: MacroEntry[], currentRange: string) => {
      if (!currentHistory || currentHistory.length === 0) {
        setAggregatedData([]);
        setDailySeries([]);
        return;
      }

      const { startDate: startDateString, endDate: endDateString } =
        getDateRangeISOStrings(currentRange);

      const startDate = new Date(startDateString);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(endDateString);
      endDate.setHours(23, 59, 59, 999);

      // Process entries into daily totals first
      const dailyTotals: { [key: string]: MacroTotals } = {};

      for (const entry of currentHistory) {
        if (!entry.createdAt) continue;

        let entryDateString: string;
        if (entry.entryDate) {
          entryDateString = entry.entryDate;
        } else {
          const createdAtDate = new Date(entry.createdAt);
          const year = createdAtDate.getFullYear();
          const month = (createdAtDate.getMonth() + 1)
            .toString()
            .padStart(2, "0");
          const day = createdAtDate.getDate().toString().padStart(2, "0");
          entryDateString = `${year}-${month}-${day}`;
        }

        const entryDate = new Date(entryDateString + "T00:00:00");
        if (entryDate >= startDate && entryDate <= endDate) {
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
      }

      // Build daily series across the entire selected range
      const daysInRange: string[] = [];
      const iterDate = new Date(startDate);
      while (iterDate <= endDate) {
        const y = iterDate.getFullYear();
        const m = (iterDate.getMonth() + 1).toString().padStart(2, "0");
        const d = iterDate.getDate().toString().padStart(2, "0");
        daysInRange.push(`${y}-${m}-${d}`);
        iterDate.setDate(iterDate.getDate() + 1);
      }

      const dailySeriesData = daysInRange.map((date) => ({
        name: formatDate(date),
        calories: dailyTotals[date]?.calories || 0,
        protein: dailyTotals[date]?.protein || 0,
        carbs: dailyTotals[date]?.carbs || 0,
        fats: dailyTotals[date]?.fats || 0,
      }));

      let chartData: any[] = [];

      switch (currentRange) {
        case "week": {
          // For weekly view: show daily data
          const dateLabels: string[] = [];
          const currentDate = new Date(startDate);

          while (currentDate <= endDate) {
            const year = currentDate.getFullYear();
            const month = (currentDate.getMonth() + 1)
              .toString()
              .padStart(2, "0");
            const day = currentDate.getDate().toString().padStart(2, "0");
            const dateString = `${year}-${month}-${day}`;
            dateLabels.push(dateString);
            currentDate.setDate(currentDate.getDate() + 1);
          }

          chartData = dateLabels.map((date) => ({
            name: formatDate(date),
            calories: dailyTotals[date]?.calories || 0,
            protein: dailyTotals[date]?.protein || 0,
            carbs: dailyTotals[date]?.carbs || 0,
            fats: dailyTotals[date]?.fats || 0,
          }));

          break;
        }
        case "month": {
          // For monthly view: aggregate by week
          const weeklyTotals: {
            [key: string]: { totals: MacroTotals; count: number };
          } = {};

          for (const [dateString, totals] of Object.entries(dailyTotals)) {
            const date = new Date(dateString);
            const weekKey = getWeekString(date);

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

          chartData = Object.entries(weeklyTotals)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([weekKey, { totals, count }]) => ({
              name: `Week ${weekKey.split("-W")[1]}`,
              calories: count > 0 ? Math.round(totals.calories / count) : 0,
              protein: count > 0 ? Math.round(totals.protein / count) : 0,
              carbs: count > 0 ? Math.round(totals.carbs / count) : 0,
              fats: count > 0 ? Math.round(totals.fats / count) : 0,
            }));

          break;
        }
        case "3months": {
          // For 3-month view: aggregate by month
          const monthlyTotals: {
            [key: string]: { totals: MacroTotals; count: number };
          } = {};

          for (const [dateString, totals] of Object.entries(dailyTotals)) {
            const date = new Date(dateString);
            const monthKey = getMonthString(date);

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

          chartData = Object.entries(monthlyTotals)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([monthKey, { totals, count }]) => {
              const [year, month] = monthKey.split("-");
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
              const monthName = monthNames[Number.parseInt(month) - 1];

              return {
                name: `${monthName} ${year}`,
                calories: count > 0 ? Math.round(totals.calories / count) : 0,
                protein: count > 0 ? Math.round(totals.protein / count) : 0,
                carbs: count > 0 ? Math.round(totals.carbs / count) : 0,
                fats: count > 0 ? Math.round(totals.fats / count) : 0,
              };
            });

          break;
        }
        // No default
      }

      setAggregatedData(chartData);
      setDailySeries(dailySeriesData);
    },
    [getDateRangeISOStrings], // formatDate is stable
  );

  useEffect(() => {
    if (history && history.length > 0) {
      processDataForCharts(history, dateRange);
      setDataProcessed(true);
    } else if (!isLoadingExternal) {
      setAggregatedData([]);
      setDailySeries([]);
      setDataProcessed(true);
    }
  }, [history, dateRange, isLoadingExternal, processDataForCharts]);

  // macroDensityData logic moved to useMacroDensityBreakdown
  // If you need macro density breakdown, use the new hook instead.

  const averages = useMemo(() => {
    if (aggregatedData.length === 0)
      return { calories: 0, protein: 0, carbs: 0, fats: 0 };

    const sum = aggregatedData.reduce(
      (accumulator, value) => accumulator + value.calories,
      0,
    );
    const proteinSum = aggregatedData.reduce(
      (accumulator, value) => accumulator + value.protein,
      0,
    );
    const carbsSum = aggregatedData.reduce(
      (accumulator, value) => accumulator + value.carbs,
      0,
    );
    const fatsSum = aggregatedData.reduce(
      (accumulator, value) => accumulator + value.fats,
      0,
    );
    const count = aggregatedData.length;

    return {
      calories: Math.round(sum / count),
      protein: Math.round(proteinSum / count),
      carbs: Math.round(carbsSum / count),
      fats: Math.round(fatsSum / count),
    };
  }, [aggregatedData]);

  const handleDownloadCSV = useCallback(() => {
    if (aggregatedData.length === 0) {
      console.warn("No data to export.");
      return;
    }
    let csvContent = "Date,Calories,Protein,Carbs,Fats\n";
    for (const item of aggregatedData) {
      csvContent += `${item.name},${item.calories},${item.protein},${item.carbs},${item.fats}\n`;
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nutrition_data_${dateRange}.csv`);
    link.style.visibility = "hidden";
    document.body.append(link);
    link.click();
    link.remove();
  }, [aggregatedData, dateRange]);

  return {
    aggregatedData,
    dailySeries,
    // macroDensityData removed; use useMacroDensityBreakdown for macro density chart data
    averages,
    handleDownloadCSV,
    getDateRangeISOStrings, // Exporting if ReportingPage still needs it directly for other components
    mapDateRangeToNumeric, // Exporting for MacroDensityBreakdown prop
    dataProcessed,
    formatDate, // Exporting if needed by other parts of ReportingPage, though ideally it's self-contained or a shared util
  };
}
