import { useState, useEffect, useCallback } from "react";
import Navbar from "@/features/layout/components/Navbar";
import { MacroDailyTotals } from "@/features/macroTracking/types";
import { useStore } from "@/store/store";
import Modal from "@/components/Modal";
import LineChartComponent from "@/components/chart/LineChartComponent";
import ReportingPageSkeleton from "../components/ReportingPageSkeleton";
import MealTimeBreakdown from "../components/MealTimeBreakdown";
import NutrientDensityVisualization from "../components/NutrientDensityVisualization";
import EnhancedInsights from "../components/EnhancedInsights";
import { motion } from "motion/react";
import DateRangeSelector from "../../../components/chart/DateRangeSelector";
import MacroSummaryStats from "../components/MacroSummaryStats";
import NutritionInsights from "../components/NutritionInsights";

export default function ReportingPage() {
  // Primary date range state - used throughout the component
  const [dateRange, setDateRange] = useState<string>("week");
  // Note: We no longer need a separate numericDateRange state as we calculate
  // numeric values on demand using mapDateRangeToNumeric
  const [aggregatedData, setAggregatedData] = useState<
    {
      name: string; // Recharts uses 'name' for the x-axis label
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
    }[]
  >([]); // Adjusted data structure for recharts
  const [showCustomDateModal, setShowCustomDateModal] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [dataProcessed, setDataProcessed] = useState(false);

  // Helper function to map dateRange string to number for selectedRange prop
  const mapDateRangeToNumeric = (range: string): 7 | 30 | 90 => {
    switch (range) {
      case "week":
        return 7;
      case "month":
        return 30;
      case "3months":
        return 90;
      // Handle "custom" range if needed, or default
      case "custom":
        // Determine the number of days for custom range if you want to pass it
        // For now, let's default or decide on a specific behavior
        if (customStartDate && customEndDate) {
          const start = new Date(customStartDate);
          const end = new Date(customEndDate);
          const diffTime = Math.abs(end.getTime() - start.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end day
          if (diffDays <= 7) return 7;
          if (diffDays <= 30) return 30;
          return 90; // Or handle larger custom ranges differently
        }
        return 7; // Default for custom if dates not set
      default:
        return 7; // Default to 7 days
    }
  };

  // Get history data from app state
  const {
    history,
    isLoading,
    error,
    fetchUserDetails,
    fetchMacroData,
    fetchWeightGoals,
  } = useStore();

  // Fetch user details and history on component mount
  useEffect(() => {
    async function loadData() {
      await fetchUserDetails();
      await fetchMacroData();
      await fetchWeightGoals();
    }
    loadData();
  }, [fetchUserDetails, fetchMacroData, fetchWeightGoals]);
  // Wrap formatDate in useCallback to prevent it from changing on every render
  const formatDate = useCallback((dateStr: string): string => {
    // Ensure consistent date handling by explicitly parsing the ISO string as local
    const [year, month, day] = dateStr.split("-").map(Number);
    // Create date using local components to avoid timezone issues
    const date = new Date(year, month - 1, day);

    // Add error handling for invalid dates if necessary
    if (isNaN(date.getTime())) {
      return "Invalid Date";
    }
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  }, []); // Empty dependency array as it doesn't depend on component state/props

  const processDataForCharts = useCallback(
    (range: string) => {
      if (!history || history.length === 0) {
        setAggregatedData([]);
        return;
      }

      const dates: { [key: string]: MacroDailyTotals } = {};

      // Use our helper function to get consistent date calculations
      const { startDate: startDateStr, endDate: endDateStr } =
        getDateRangeISOStrings(range);

      const startDate = new Date(startDateStr);
      startDate.setHours(0, 0, 0, 0); // Normalize start date to beginning of day

      const endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999); // Set to end of day to ensure today's data is included

      // Initialize all dates in range with zero values
      const dateLabels: string[] = [];
      const currentDate = new Date(startDate);

      while (currentDate <= endDate) {
        // Generate date string in local timezone to avoid UTC conversion issues
        const year = currentDate.getFullYear();
        const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
        const day = currentDate.getDate().toString().padStart(2, "0");
        const dateString = `${year}-${month}-${day}`;

        dateLabels.push(dateString);
        dates[dateString] = {
          protein: 0,
          carbs: 0,
          fats: 0,
          calories: 0,
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }

      // Aggregate data by date
      let entriesProcessed = 0;
      history.forEach((entry) => {
        if (!entry.created_at) {
          console.warn("Entry missing created_at timestamp", entry);
          return;
        }

        // --- Updated Date String Logic ---
        let entryDateStr: string;
        if (entry.entry_date) {
          entryDateStr = entry.entry_date; // Assuming 'YYYY-MM-DD'
        } else {
          // Use local date parts from created_at to avoid timezone shifts
          const createdAtDate = new Date(entry.created_at);
          const year = createdAtDate.getFullYear();
          const month = (createdAtDate.getMonth() + 1)
            .toString()
            .padStart(2, "0");
          const day = createdAtDate.getDate().toString().padStart(2, "0");
          entryDateStr = `${year}-${month}-${day}`;
        }
        // --- End Updated Logic ---

        const entryDate = new Date(entryDateStr + "T00:00:00"); // Local midnight

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
          entriesProcessed++;
        }
      });

      console.log(
        `Processed ${entriesProcessed} entries from ${history.length} total entries for range ${range}`
      );

      // Prepare data for recharts
      const chartData = dateLabels.map((date) => ({
        name: formatDate(date), // Use 'name' for x-axis label
        calories: dates[date].calories,
        protein: dates[date].protein,
        carbs: dates[date].carbs,
        fats: dates[date].fats,
      }));

      setAggregatedData(chartData);
    },
    [history, formatDate] // Now depends on the stable formatDate function
  );
  // Process data when history or date range changes
  useEffect(() => {
    if (history && history.length > 0) {
      processDataForCharts(dateRange);
      setDataProcessed(true);
    } else if (!isLoading) {
      setAggregatedData([]); // Clear data if no history
      setDataProcessed(true); // Mark as processed even if empty
    }
    // Include processDataForCharts in the dependency array
  }, [history, dateRange, isLoading, processDataForCharts]); // We've refactored to use processDataForCharts directly with the 'custom' range
  // instead of having a separate custom date processing function
  /**
   * Validates and applies custom date range selection
   * Uses improved error handling and avoids redundant date parsing
   */ const handleApplyCustomDateRange = useCallback(() => {
    if (!customStartDate || !customEndDate) {
      // Add user feedback (e.g., toast notification)
      console.error("Please select both start and end dates.");
      return;
    }

    // Parse dates once
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);

    // Validate date order
    if (start > end) {
      console.error("Start date cannot be after end date.");
      return;
    }

    // Set to custom range mode
    setDateRange("custom");

    // We don't need to call processDataForCharts here because the dateRange change
    // will trigger the useEffect that calls processDataForCharts

    // Close the modal
    setShowCustomDateModal(false);
  }, [customStartDate, customEndDate]);
  /**
   * Centralized helper function to convert a date range string ('week', 'month', '3months', 'custom')
   * into corresponding ISO date strings (YYYY-MM-DD) for startDate and endDate.
   *
   * This function provides consistent date range calculations across all components,
   * regardless of whether they need exact date strings (like MealTimeBreakdown) or
   * numeric day counts (like NutrientDensityVisualization).
   *
   * Advantages:
   * - Single source of truth for date range calculations
   * - DRY code that's easier to maintain
   * - Consistent handling of custom date ranges
   * - Properly handles timezone issues by working with local date strings
   *
   * @param range The date range identifier ('week', 'month', '3months', 'custom')
   * @returns An object with startDate and endDate as ISO strings (YYYY-MM-DD)
   */ const getDateRangeISOStrings = useCallback(
    (range: string): { startDate: string; endDate: string } => {
      // For custom range, use the custom dates directly
      if (range === "custom" && customStartDate && customEndDate) {
        return { startDate: customStartDate, endDate: customEndDate };
      }

      // For standard ranges, calculate dates
      const today = new Date();
      const endDate = today.toISOString().split("T")[0]; // Today as ISO string

      // Calculate start date based on numeric range
      const days = mapDateRangeToNumeric(range);
      const start = new Date(today);
      start.setDate(today.getDate() - (days - 1)); // Subtract days-1 to include today
      const startDate = start.toISOString().split("T")[0];

      return { startDate, endDate };
    },
    [customStartDate, customEndDate, mapDateRangeToNumeric]
  );

  const calculateAverages = () => {
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
  };

  const averages = calculateAverages();

  const downloadCSV = () => {
    if (aggregatedData.length === 0) {
      console.warn("No data to export.");
      // Optionally show a message to the user
      return;
    }
    // Create CSV content
    let csvContent = "Date,Calories,Protein,Carbs,Fats\n"; // Adjusted order
    aggregatedData.forEach((item) => {
      csvContent += `${item.name},${item.calories},${item.protein},${item.carbs},${item.fats}\n`;
    });

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const rangeSuffix =
      dateRange === "custom"
        ? `${customStartDate}_to_${customEndDate}`
        : dateRange;
    link.setAttribute("download", `nutrition_data_${rangeSuffix}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Define chart configurations for the new component
  const calorieChartLines = [
    { dataKey: "calories", name: "Calories", color: "hsl(231, 77%, 66%)" }, // indigo-500 approx
  ];

  const macroChartLines = [
    { dataKey: "protein", name: "Protein (g)", color: "hsl(145, 63%, 49%)" }, // green-500 approx
    { dataKey: "carbs", name: "Carbs (g)", color: "hsl(217, 91%, 60%)" }, // blue-500 approx
    { dataKey: "fats", name: "Fats (g)", color: "hsl(0, 84%, 60%)" }, // red-500 approx
  ];

  const showNoDataMessage =
    !isLoading && dataProcessed && aggregatedData.length === 0;

  if (isLoading) return <ReportingPageSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300">
      <Navbar />
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(67,56,202,0.15),transparent)] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
          <div className="mb-6">
            <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-gray-300 text-transparent bg-clip-text tracking-tight">
              Nutrition Reports
            </h1>
            <p className="text-gray-400 mt-2 text-sm sm:text-base">
              Track your nutrition trends and progress over time
            </p>
          </div>
          {error && (
            <div className="mb-6 text-red-400 bg-red-900/50 p-4 rounded-lg border border-red-800/50 shadow-lg">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 mr-2 text-red-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                {error}
              </div>
            </div>
          )}
          {/* Debug info for development - Adjusted condition */}
          {!isLoading && !error && history?.length === 0 && dataProcessed && (
            <div className="mb-6 text-yellow-400 bg-yellow-900/30 p-4 rounded-lg border border-yellow-800/30 shadow-lg">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 mr-2 text-yellow-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  ></path>
                </svg>
                No nutrition history found. Add some entries to see your
                reporting data.
              </div>
            </div>
          )}
          {/* Date Range Selector */}
          <DateRangeSelector
            currentRange={dateRange}
            onRangeChange={setDateRange}
            onCustomRangeClick={() => setShowCustomDateModal(true)}
            onExportClick={downloadCSV}
            isExportDisabled={aggregatedData.length === 0 || isLoading}
          />
          {/* Summary Stats */}
          <MacroSummaryStats data={aggregatedData} />
          {/* Mobile-optimized: MealTimeBreakdown and NutrientDensityVisualization */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="order-2 md:order-1">
              {/* 
                MealTimeBreakdown works with raw history data and needs exact ISO date strings
                to properly filter entries. It doesn't care about the numeric range value.
              */}
              <MealTimeBreakdown
                history={history}
                {...getDateRangeISOStrings(dateRange)}
              />
            </div>
            <div className="order-1 md:order-2">
              {/* 
                NutrientDensityVisualization works with pre-aggregated data and uses numeric range
                for visualization purposes, not for data filtering. That's why it takes selectedRange
                as a number (7, 30, 90) instead of ISO date strings.
              */}
              <NutrientDensityVisualization
                data={aggregatedData}
                selectedRange={mapDateRangeToNumeric(dateRange)}
              />
            </div>
          </div>
          {/* Charts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <motion.div
              layout
              className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-5"
            >
              <h2 className="text-lg font-semibold text-gray-200 mb-6">
                Calorie Intake
              </h2>
              <div className="h-80">
                <LineChartComponent
                  data={aggregatedData}
                  lines={calorieChartLines}
                  isLoading={isLoading || !dataProcessed}
                  showNoDataMessage={showNoDataMessage}
                />
              </div>
            </motion.div>
            <motion.div
              layout
              className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-5"
            >
              <h2 className="text-lg font-semibold text-gray-200 mb-6">
                Macronutrient Intake
              </h2>
              <div className="h-80">
                <LineChartComponent
                  data={aggregatedData}
                  lines={macroChartLines}
                  isLoading={isLoading || !dataProcessed}
                  showNoDataMessage={showNoDataMessage}
                />
              </div>
            </motion.div>
          </div>
          {/* Enhanced Insights (correlation, streaks, quality score) */}
          <div className="mb-6">
            <EnhancedInsights
              aggregatedData={aggregatedData}
              averages={averages}
              isLoading={isLoading}
            />
          </div>
          {/* Nutrition Insights */}
          <NutritionInsights
            isLoading={isLoading}
            dataProcessed={dataProcessed}
            showNoDataMessage={showNoDataMessage}
            aggregatedData={aggregatedData}
            averages={averages}
          />
        </div>
      </div>

      {/* Custom Date Range Modal */}
      <Modal
        isOpen={showCustomDateModal}
        onClose={() => setShowCustomDateModal(false)}
        title="Select Custom Date Range"
        variant="form"
        onSave={handleApplyCustomDateRange}
        size="sm"
      >
        <div className="space-y-4 p-1">
          {/* Added padding */}
          <div>
            <label
              htmlFor="startDate"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              Start Date
            </label>
            <input
              id="startDate"
              type="date"
              className="w-full rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 p-2" // Added padding
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              max={new Date().toISOString().split("T")[0]} // Prevent future dates
            />
          </div>
          <div>
            <label
              htmlFor="endDate"
              className="block text-sm font-medium text-gray-300 mb-1"
            >
              End Date
            </label>
            <input
              id="endDate"
              type="date"
              className="w-full rounded-md bg-gray-700 border-gray-600 text-gray-200 focus:ring-indigo-500 focus:border-indigo-500 p-2" // Added padding
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              min={customStartDate} // Prevent end date before start date
              max={new Date().toISOString().split("T")[0]} // Prevent future dates
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
