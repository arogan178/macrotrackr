import { useState, useEffect, useCallback, useMemo } from "react";
import { MacroEntry } from "../../macroTracking/types";
import { formatDate } from "../utils";

interface MacroTotals {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

export function useReportingLogic(
  history: MacroEntry[] | null,
  dateRange: string,
  isLoadingExternal: boolean // To know if history is loading vs. empty
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

  const mapDateRangeToNumeric = useCallback((range: string): 7 | 30 | 90 => {
    switch (range) {
      case "week":
        return 7;
      case "month":
        return 30;
      case "3months":
        return 90;
      default:
        return 7;
    }
  }, []);

  const getDateRangeISOStrings = useCallback(
    (range: string): { startDate: string; endDate: string } => {
      const today = new Date();
      const endDateStr = today.toISOString().split("T")[0];
      const days = mapDateRangeToNumeric(range);
      const startDateObj = new Date(today);
      startDateObj.setDate(today.getDate() - (days - 1));
      const startDateStr = startDateObj.toISOString().split("T")[0];
      return { startDate: startDateStr, endDate: endDateStr };
    },
    [mapDateRangeToNumeric]
  );

  const processDataForCharts = useCallback(
    (currentHistory: MacroEntry[], currentRange: string) => {
      if (!currentHistory || currentHistory.length === 0) {
        setAggregatedData([]);
        return;
      }

      const dates: { [key: string]: MacroTotals } = {};
      const { startDate: startDateStr, endDate: endDateStr } =
        getDateRangeISOStrings(currentRange);

      const startDate = new Date(startDateStr);
      startDate.setHours(0, 0, 0, 0);
      const endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);

      const dateLabels: string[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
        const day = currentDate.getDate().toString().padStart(2, "0");
        const dateString = `${year}-${month}-${day}`;
        dateLabels.push(dateString);
        dates[dateString] = { protein: 0, carbs: 0, fats: 0, calories: 0 };
        currentDate.setDate(currentDate.getDate() + 1);
      }

      currentHistory.forEach((entry: MacroEntry) => {
        if (!entry.created_at) return;

        let entryDateStr: string;
        if (entry.entry_date) {
          entryDateStr = entry.entry_date;
        } else {
          const createdAtDate = new Date(entry.created_at);
          const year = createdAtDate.getFullYear();
          const month = (createdAtDate.getMonth() + 1)
            .toString()
            .padStart(2, "0");
          const day = createdAtDate.getDate().toString().padStart(2, "0");
          entryDateStr = `${year}-${month}-${day}`;
        }
        const entryDate = new Date(entryDateStr + "T00:00:00");

        if (
          entryDate >= startDate &&
          entryDate <= endDate &&
          dates[entryDateStr]
        ) {
          dates[entryDateStr].protein += entry.protein;
          dates[entryDateStr].carbs += entry.carbs;
          dates[entryDateStr].fats += entry.fats;
          dates[entryDateStr].calories +=
            entry.protein * 4 + entry.carbs * 4 + entry.fats * 9;
        }
      });

      const chartData = dateLabels.map((date) => ({
        name: formatDate(date),
        calories: dates[date].calories,
        protein: dates[date].protein,
        carbs: dates[date].carbs,
        fats: dates[date].fats,
      }));
      setAggregatedData(chartData);
    },
    [getDateRangeISOStrings] // formatDate is stable
  );

  useEffect(() => {
    if (history && history.length > 0) {
      processDataForCharts(history, dateRange);
      setDataProcessed(true);
    } else if (!isLoadingExternal) {
      setAggregatedData([]);
      setDataProcessed(true);
    }
  }, [history, dateRange, isLoadingExternal, processDataForCharts]);

  const nutrientDensityData = useMemo(() => {
    if (!history || history.length === 0) {
      return [];
    }
    const { startDate: startDateStr, endDate: endDateStr } =
      getDateRangeISOStrings(dateRange);
    const startDate = new Date(startDateStr + "T00:00:00");
    const endDate = new Date(endDateStr + "T23:59:59");

    const relevantEntries = history.filter((entry) => {
      let entryDateStr: string;
      if (entry.entry_date) {
        entryDateStr = entry.entry_date;
      } else if (entry.created_at) {
        const createdAtDate = new Date(entry.created_at);
        entryDateStr = `${createdAtDate.getFullYear()}-${(
          createdAtDate.getMonth() + 1
        )
          .toString()
          .padStart(2, "0")}-${createdAtDate
          .getDate()
          .toString()
          .padStart(2, "0")}`;
      } else {
        return false;
      }
      const entryDate = new Date(entryDateStr + "T00:00:00");
      return entryDate >= startDate && entryDate <= endDate;
    });

    return relevantEntries.map((entry) => ({
      name: entry.foodName || entry.mealName || "Unknown Item",
      calories: entry.protein * 4 + entry.carbs * 4 + entry.fats * 9,
      protein: entry.protein,
      carbs: entry.carbs,
      fats: entry.fats,
    }));
  }, [history, dateRange, getDateRangeISOStrings]);

  const averages = useMemo(() => {
    if (aggregatedData.length === 0)
      return { calories: 0, protein: 0, carbs: 0, fats: 0 };

    const sum = aggregatedData.reduce((acc, val) => acc + val.calories, 0);
    const proteinSum = aggregatedData.reduce(
      (acc, val) => acc + val.protein,
      0
    );
    const carbsSum = aggregatedData.reduce((acc, val) => acc + val.carbs, 0);
    const fatsSum = aggregatedData.reduce((acc, val) => acc + val.fats, 0);
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
    aggregatedData.forEach((item) => {
      csvContent += `${item.name},${item.calories},${item.protein},${item.carbs},${item.fats}\n`;
    });

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nutrition_data_${dateRange}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [aggregatedData, dateRange]);

  return {
    aggregatedData,
    nutrientDensityData,
    averages,
    handleDownloadCSV,
    getDateRangeISOStrings, // Exporting if ReportingPage still needs it directly for other components
    mapDateRangeToNumeric, // Exporting for NutrientDensityVisualization prop
    dataProcessed,
    formatDate, // Exporting if needed by other parts of ReportingPage, though ideally it's self-contained or a shared util
  };
}
