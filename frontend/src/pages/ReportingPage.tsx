import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import { MacroEntry, MacroTotals } from "../types";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ChartOptions,
} from "chart.js";
import { useAppState } from "../store/app-state";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

export default function ReportingPage() {
  const [dateRange, setDateRange] = useState<string>("week");
  const [aggregatedData, setAggregatedData] = useState<{
    labels: string[];
    calories: number[];
    protein: number[];
    carbs: number[];
    fats: number[];
  }>({
    labels: [],
    calories: [],
    protein: [],
    carbs: [],
    fats: [],
  });

  // Get history data from app state
  const { history, isLoading, error, fetchUserDetails } = useAppState();

  // Fetch user details and history on component mount
  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  // Process data when history or date range changes
  useEffect(() => {
    if (history.length > 0) {
      processDataForCharts(dateRange);
    }
  }, [history, dateRange]);

  const processDataForCharts = (range: string) => {
    // Process raw data into chart-friendly format
    const today = new Date();
    const dates: { [key: string]: MacroTotals } = {};

    let startDate: Date;
    switch (range) {
      case "week":
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
        break;
      case "month":
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 1);
        break;
      case "3months":
        startDate = new Date(today);
        startDate.setMonth(today.getMonth() - 3);
        break;
      default:
        startDate = new Date(today);
        startDate.setDate(today.getDate() - 7);
    }

    // Initialize all dates in range with zero values
    const dateLabels: string[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= today) {
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
    history.forEach((entry) => {
      const entryDate = new Date(entry.created_at).toISOString().split("T")[0];
      if (dates[entryDate]) {
        dates[entryDate].protein += entry.protein;
        dates[entryDate].carbs += entry.carbs;
        dates[entryDate].fats += entry.fats;
        dates[entryDate].calories +=
          entry.protein * 4 + entry.carbs * 4 + entry.fats * 9;
      }
    });

    // Prepare data for charts
    setAggregatedData({
      labels: dateLabels.map((date) => formatDate(date)),
      calories: dateLabels.map((date) => dates[date].calories),
      protein: dateLabels.map((date) => dates[date].protein),
      carbs: dateLabels.map((date) => dates[date].carbs),
      fats: dateLabels.map((date) => dates[date].fats),
    });
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "top" as const,
        labels: {
          color: "#d1d5db", // text-gray-300
          font: {
            family: "'Inter', sans-serif",
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(17, 24, 39, 0.8)",
        titleColor: "#f3f4f6",
        bodyColor: "#d1d5db",
        borderColor: "rgba(75, 85, 99, 0.3)",
        borderWidth: 1,
        padding: 10,
        boxPadding: 4,
        usePointStyle: true,
        bodyFont: {
          family: "'Inter', sans-serif",
          size: 12,
        },
        titleFont: {
          family: "'Inter', sans-serif",
          size: 14,
          weight: "600",
        },
        footerFont: {
          family: "'Inter', sans-serif",
        },
      },
    },
    scales: {
      x: {
        grid: {
          color: "rgba(75, 85, 99, 0.2)",
        },
        ticks: {
          color: "#9ca3af", // text-gray-400
          font: {
            family: "'Inter', sans-serif",
          },
        },
      },
      y: {
        grid: {
          color: "rgba(75, 85, 99, 0.2)",
        },
        ticks: {
          color: "#9ca3af", // text-gray-400
          font: {
            family: "'Inter', sans-serif",
          },
        },
        beginAtZero: true,
      },
    },
    elements: {
      line: {
        tension: 0.4,
      },
      point: {
        radius: 3,
        hoverRadius: 5,
      },
    },
  };

  const calorieChartData = {
    labels: aggregatedData.labels,
    datasets: [
      {
        label: "Calories",
        data: aggregatedData.calories,
        borderColor: "rgb(99, 102, 241)", // indigo-500
        backgroundColor: "rgba(99, 102, 241, 0.5)", // indigo-500 with opacity
        fill: true,
      },
    ],
  };

  const macrosChartData = {
    labels: aggregatedData.labels,
    datasets: [
      {
        label: "Protein (g)",
        data: aggregatedData.protein,
        borderColor: "rgb(34, 197, 94)", // green-500
        backgroundColor: "rgba(34, 197, 94, 0.5)", // green-500 with opacity
      },
      {
        label: "Carbs (g)",
        data: aggregatedData.carbs,
        borderColor: "rgb(59, 130, 246)", // blue-500
        backgroundColor: "rgba(59, 130, 246, 0.5)", // blue-500 with opacity
      },
      {
        label: "Fats (g)",
        data: aggregatedData.fats,
        borderColor: "rgb(239, 68, 68)", // red-500
        backgroundColor: "rgba(239, 68, 68, 0.5)", // red-500 with opacity
      },
    ],
  };

  const calculateAverages = () => {
    if (aggregatedData.labels.length === 0)
      return { calories: 0, protein: 0, carbs: 0, fats: 0 };

    const sum = aggregatedData.calories.reduce((acc, val) => acc + val, 0);
    const proteinSum = aggregatedData.protein.reduce(
      (acc, val) => acc + val,
      0
    );
    const carbsSum = aggregatedData.carbs.reduce((acc, val) => acc + val, 0);
    const fatsSum = aggregatedData.fats.reduce((acc, val) => acc + val, 0);

    return {
      calories: Math.round(sum / aggregatedData.labels.length),
      protein: Math.round(proteinSum / aggregatedData.labels.length),
      carbs: Math.round(carbsSum / aggregatedData.labels.length),
      fats: Math.round(fatsSum / aggregatedData.labels.length),
    };
  };

  const averages = calculateAverages();

  const downloadCSV = () => {
    // Create CSV content
    let csvContent = "Date,Protein,Carbs,Fats,Calories\n";
    for (let i = 0; i < aggregatedData.labels.length; i++) {
      csvContent += `${aggregatedData.labels[i]},${aggregatedData.protein[i]},${aggregatedData.carbs[i]},${aggregatedData.fats[i]},${aggregatedData.calories[i]}\n`;
    }

    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `nutrition_data_${dateRange}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <Navbar />
      <div className="relative z-1">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_rgba(67,56,202,0.1),transparent_70%)] pointer-events-none"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
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
                </div>
              </div>

              <button
                onClick={downloadCSV}
                className="px-4 py-2 bg-indigo-700/60 hover:bg-indigo-700/80 text-indigo-100 rounded-lg text-sm font-medium flex items-center transition-all duration-200 border border-indigo-600/30"
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 flex flex-col">
              <span className="text-sm text-gray-400 mb-1">
                Avg. Daily Calories
              </span>
              <span className="text-2xl font-bold text-white">
                {averages.calories}
              </span>
            </div>
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 flex flex-col">
              <span className="text-sm text-gray-400 mb-1">
                Avg. Daily Protein
              </span>
              <span className="text-2xl font-bold text-green-400">
                {averages.protein}g
              </span>
            </div>
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 flex flex-col">
              <span className="text-sm text-gray-400 mb-1">
                Avg. Daily Carbs
              </span>
              <span className="text-2xl font-bold text-blue-400">
                {averages.carbs}g
              </span>
            </div>
            <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5 flex flex-col">
              <span className="text-sm text-gray-400 mb-1">
                Avg. Daily Fats
              </span>
              <span className="text-2xl font-bold text-red-400">
                {averages.fats}g
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
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
                      <p className="text-gray-400">Loading data...</p>
                    </div>
                  </div>
                ) : (
                  <Line options={chartOptions} data={calorieChartData} />
                )}
              </div>
            </div>

            <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5">
              <h2 className="text-lg font-semibold text-gray-200 mb-4">
                Macronutrient Intake
              </h2>
              <div className="h-80">
                {isLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center">
                      <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
                      <p className="text-gray-400">Loading data...</p>
                    </div>
                  </div>
                ) : (
                  <Line options={chartOptions} data={macrosChartData} />
                )}
              </div>
            </div>
          </div>

          {/* Additional Insights */}
          <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-5">
            <h2 className="text-lg font-semibold text-gray-200 mb-4">
              Nutrition Insights
            </h2>

            {isLoading ? (
              <div className="flex items-center justify-center h-40">
                <div className="flex flex-col items-center">
                  <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-indigo-500 mb-3"></div>
                  <p className="text-gray-400">Loading insights...</p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-lg border border-indigo-500/20 bg-indigo-900/10">
                  <h3 className="text-md font-medium text-indigo-300 mb-2">
                    Consistency Analysis
                  </h3>
                  <p className="text-gray-300">
                    {aggregatedData.calories.filter((cal) => cal > 0).length}{" "}
                    out of {aggregatedData.labels.length} days had tracked
                    nutrition data.
                    {aggregatedData.calories.filter((cal) => cal > 0).length /
                      aggregatedData.labels.length >=
                    0.7
                      ? " Great job maintaining consistency in your tracking!"
                      : " Try to log your nutrition more consistently for better insights."}
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-green-500/20 bg-green-900/10">
                  <h3 className="text-md font-medium text-green-300 mb-2">
                    Protein Intake
                  </h3>
                  <p className="text-gray-300">
                    Your average daily protein intake is {averages.protein}g.
                    {averages.protein >= 120
                      ? " You're doing great with protein intake!"
                      : " Consider increasing your protein intake for better muscle recovery and growth."}
                  </p>
                </div>

                <div className="p-4 rounded-lg border border-blue-500/20 bg-blue-900/10">
                  <h3 className="text-md font-medium text-blue-300 mb-2">
                    Carbohydrate Patterns
                  </h3>
                  <p className="text-gray-300">
                    Your average daily carbohydrate intake is {averages.carbs}g.
                    {Math.max(...aggregatedData.carbs) -
                      Math.min(...aggregatedData.carbs.filter((c) => c > 0)) >
                    100
                      ? " Your carbohydrate intake varies significantly day to day. Consider more consistency for stable energy levels."
                      : " Your carbohydrate intake is relatively consistent, which helps maintain stable energy levels."}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
