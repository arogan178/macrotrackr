import { useState, useEffect, useCallback } from "react";
import Navbar from "@/features/layout/components/Navbar";
import { MacroDailyTotals } from "@/features/macroTracking/types";
import { useStore } from "@/store/store";
import Modal from "@/components/Modal";
import LineChartComponent from "@/components/reporting/LineChartComponent";

export default function ReportingPage() {
  const [dateRange, setDateRange] = useState<string>("week");
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

  // Get history data from app state
  const { history, isLoading, error, fetchUserDetails, fetchMacroData } =
    useStore();

  // Fetch user details and history on component mount
  useEffect(() => {
    async function loadData() {
      await fetchUserDetails();
      await fetchMacroData();
    }
    loadData();
  }, [fetchUserDetails, fetchMacroData]);

  // Wrap formatDate in useCallback to prevent it from changing on every render
  const formatDate = useCallback((dateStr: string): string => {
    const date = new Date(dateStr);
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

      const today = new Date();
      const dates: { [key: string]: MacroDailyTotals } = {};

      let startDate: Date;
      switch (range) {
        case "week":
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 6); // Adjust for 7 days including today
          break;
        case "month":
          startDate = new Date(today);
          startDate.setMonth(today.getMonth() - 1);
          startDate.setDate(startDate.getDate() + 1); // Adjust for 30 days including today
          break;
        case "3months":
          startDate = new Date(today);
          startDate.setMonth(today.getMonth() - 3);
          startDate.setDate(startDate.getDate() + 1); // Adjust for 90 days including today
          break;
        case "custom":
          // Custom range is handled separately
          return;
        default:
          startDate = new Date(today);
          startDate.setDate(today.getDate() - 6);
      }
      startDate.setHours(0, 0, 0, 0); // Normalize start date

      // Initialize all dates in range with zero values
      const dateLabels: string[] = [];
      const currentDate = new Date(startDate);
      const endDate = new Date(today);
      endDate.setHours(23, 59, 59, 999); // Normalize end date

      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split("T")[0];
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

        const entryDateStr =
          entry.entry_date ||
          new Date(entry.created_at).toISOString().split("T")[0];
        const entryDate = new Date(entryDateStr + "T00:00:00"); // Ensure date comparison is correct

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
      console.log("Processing data with history length:", history.length);
      processDataForCharts(dateRange);
      setDataProcessed(true);
    } else if (!isLoading) {
      console.log("No history data available or still loading");
      setAggregatedData([]); // Clear data if no history
      setDataProcessed(true); // Mark as processed even if empty
    }
    // Include processDataForCharts in the dependency array
  }, [history, dateRange, isLoading, processDataForCharts]);

  const processDataForCustomDateRange = useCallback(
    (startDate: Date, endDate: Date) => {
      if (!history || history.length === 0) {
        setAggregatedData([]);
        return;
      }

      const dates: { [key: string]: MacroDailyTotals } = {};
      const dateLabels: string[] = [];
      const currentDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999); // Include the end date fully

      while (currentDate <= endDate) {
        const dateString = currentDate.toISOString().split("T")[0];
        dateLabels.push(dateString);
        dates[dateString] = {
          protein: 0,
          carbs: 0,
          fats: 0,
          calories: 0,
        };
        currentDate.setDate(currentDate.getDate() + 1);
      }

      history.forEach((entry) => {
        const entryDateStr =
          entry.entry_date ||
          new Date(entry.created_at).toISOString().split("T")[0];
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
        name: formatDate(date), // Use 'name' for x-axis label
        calories: dates[date].calories,
        protein: dates[date].protein,
        carbs: dates[date].carbs,
        fats: dates[date].fats,
      }));

      setAggregatedData(chartData);
    },
    [history, formatDate]
  ); // Now depends on the stable formatDate function

  const handleApplyCustomDateRange = useCallback(() => {
    if (!customStartDate || !customEndDate) {
      // Add user feedback (e.g., toast notification)
      console.error("Please select both start and end dates.");
      return;
    }
    const start = new Date(customStartDate);
    const end = new Date(customEndDate);
    start.setHours(0, 0, 0, 0); // Normalize start date
    end.setHours(23, 59, 59, 999); // Normalize end date

    if (start > end) {
      // Add user feedback
      console.error("Start date cannot be after end date.");
      return;
    }

    setDateRange("custom"); // Set the range state
    // Ensure processDataForCustomDateRange is defined before calling
    if (processDataForCustomDateRange) {
      const start = new Date(customStartDate);
      const end = new Date(customEndDate);
      start.setHours(0, 0, 0, 0); // Normalize start date
      end.setHours(23, 59, 59, 999); // Normalize end date
      processDataForCustomDateRange(start, end);
    }
    setShowCustomDateModal(false);
  }, [customStartDate, customEndDate, processDataForCustomDateRange]); // Added dependency

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-gray-300">
      <Navbar />
      <div className="relative min-h-screen">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(67,56,202,0.15),transparent)] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative">
          <div className="mb-6">
            <h1 className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-white via-indigo-200 to-gray-300 text-transparent bg-clip-text tracking-tight">
              Nutrition Reports
            </h1>
            <p className="text-gray-400 mt-2">
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

          {/* Date Range Selection */}
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-4 mb-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex items-center">
                <span className="text-gray-300 font-medium mr-3">
                  Time Period:
                </span>
                <div className="flex bg-gray-900/50 rounded-lg p-1 border border-gray-700/50">
                  <button
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      dateRange === "week"
                        ? "bg-indigo-900/50 text-indigo-100 shadow-sm"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                    onClick={() => setDateRange("week")}
                  >
                    7 Days
                  </button>
                  <button
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      dateRange === "month"
                        ? "bg-indigo-900/50 text-indigo-100 shadow-sm"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                    onClick={() => setDateRange("month")}
                  >
                    30 Days
                  </button>
                  <button
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      dateRange === "3months"
                        ? "bg-indigo-900/50 text-indigo-100 shadow-sm"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                    onClick={() => setDateRange("3months")}
                  >
                    90 Days
                  </button>
                  <button
                    className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                      dateRange === "custom"
                        ? "bg-indigo-900/50 text-indigo-100 shadow-sm"
                        : "text-gray-400 hover:text-gray-300"
                    }`}
                    onClick={() => setShowCustomDateModal(true)}
                  >
                    Custom
                  </button>
                </div>
              </div>

              <button
                onClick={downloadCSV}
                disabled={aggregatedData.length === 0 || isLoading} // Disable if no data or loading
                className="px-4 py-2 bg-indigo-700/60 hover:bg-indigo-700/80 text-indigo-100 rounded-lg text-sm font-medium flex items-center transition-all duration-200 border border-indigo-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg
                  className="w-4 h-4 mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  ></path>
                </svg>
                Export CSV
              </button>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 flex flex-col">
              <span className="text-sm text-gray-400 mb-1">
                Avg. Daily Calories
              </span>
              <span className="text-2xl font-bold text-white">
                {isLoading ? "-" : averages.calories}
              </span>
            </div>
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 flex flex-col">
              <span className="text-sm text-gray-400 mb-1">
                Avg. Daily Protein
              </span>
              <span className="text-2xl font-bold text-green-400">
                {isLoading ? "-" : `${averages.protein}g`}
              </span>
            </div>
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 flex flex-col">
              <span className="text-sm text-gray-400 mb-1">
                Avg. Daily Carbs
              </span>
              <span className="text-2xl font-bold text-blue-400">
                {isLoading ? "-" : `${averages.carbs}g`}
              </span>
            </div>
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 flex flex-col">
              <span className="text-sm text-gray-400 mb-1">
                Avg. Daily Fats
              </span>
              <span className="text-2xl font-bold text-red-400">
                {isLoading ? "-" : `${averages.fats}g`}
              </span>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-6 mb-6">
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5">
              <h2 className="text-lg font-semibold text-gray-200 mb-4">
                Calorie Intake
              </h2>
              <div className="h-80">
                <LineChartComponent
                  data={aggregatedData}
                  lines={calorieChartLines}
                  isLoading={isLoading || !dataProcessed} // Show loading until data is processed
                  showNoDataMessage={showNoDataMessage}
                />
              </div>
            </div>

            <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5">
              <h2 className="text-lg font-semibold text-gray-200 mb-4">
                Macronutrient Intake
              </h2>
              <div className="h-80">
                <LineChartComponent
                  data={aggregatedData}
                  lines={macroChartLines}
                  isLoading={isLoading || !dataProcessed} // Show loading until data is processed
                  showNoDataMessage={showNoDataMessage}
                />
              </div>
            </div>
          </div>

          {/* Additional Insights */}
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5">
            <h2 className="text-lg font-semibold text-gray-200 mb-4">
              Nutrition Insights
            </h2>
            {isLoading || !dataProcessed ? ( // Show loading until data is processed
              <div className="flex items-center justify-center h-40">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
                  <p className="text-gray-400">Loading insights...</p>
                </div>
              </div>
            ) : showNoDataMessage ? (
              <div className="flex items-center justify-center h-40">
                <p className="text-gray-400 text-center">
                  No insights available due to lack of data.
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {/* Consistency Analysis */}
                  <div className="p-4 rounded-lg border border-indigo-500/20 bg-indigo-900/10">
                    <h3 className="text-md font-medium text-indigo-300 mb-2">
                      Consistency Analysis
                    </h3>
                    <p className="text-gray-300">
                      {aggregatedData.filter((d) => d.calories > 0).length} out
                      of {aggregatedData.length} days had tracked nutrition
                      data.
                      {aggregatedData.filter((d) => d.calories > 0).length /
                        aggregatedData.length >=
                      0.7
                        ? " Great job maintaining consistency in your tracking!"
                        : " Try to log your nutrition more consistently for better insights."}
                    </p>
                  </div>

                  {/* Protein Intake */}
                  <div className="p-4 rounded-lg border border-green-500/20 bg-green-900/10">
                    <h3 className="text-md font-medium text-green-300 mb-2">
                      Protein Intake
                    </h3>
                    <p className="text-gray-300">
                      Your average daily protein intake is {averages.protein}g.
                      {averages.protein === 0
                        ? " No protein data tracked."
                        : averages.protein >= 120
                        ? " You're doing great with protein intake!"
                        : " Consider increasing your protein intake for better muscle recovery and growth."}
                    </p>
                  </div>

                  {/* Carbohydrate Patterns */}
                  <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-900/10">
                    <h3 className="text-md font-medium text-blue-300 mb-2">
                      Carbohydrate Patterns
                    </h3>
                    <p className="text-gray-300">
                      Your average daily carbohydrate intake is {averages.carbs}
                      g.
                      {averages.carbs === 0
                        ? " No carbohydrate data tracked."
                        : (() => {
                            const trackedCarbs = aggregatedData
                              .map((d) => d.carbs)
                              .filter((c) => c > 0);
                            if (trackedCarbs.length < 2)
                              return " Not enough data for pattern analysis.";
                            const variation =
                              Math.max(...trackedCarbs) -
                              Math.min(...trackedCarbs);
                            return variation > 100
                              ? " Your carbohydrate intake varies significantly day to day. Consider more consistency for stable energy levels."
                              : " Your carbohydrate intake is relatively consistent, which helps maintain stable energy levels.";
                          })()}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
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
          {" "}
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
