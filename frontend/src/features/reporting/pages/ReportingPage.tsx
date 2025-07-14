import { useLoaderData } from "@tanstack/react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";

import { reportingRoute, rootRoute } from "@/appRouter";
import { ProFeature } from "@/components/billing";
import { DateRangeSelector, LineChartComponent } from "@/components/chart";
import { Navbar } from "@/components/layout";
import { useStore } from "@/store/store";

import {
  MacroDensityBreakdown,
  MacroSummaryStats,
  MealTimeBreakdown,
  ReportingPageSkeleton,
  UnifiedInsights,
} from "../components";
import { useMacroDensityBreakdown } from "../hooks/useMacroDensityBreakdown";
import { useReportingLogic } from "../hooks/useReportingLogic";

export default function ReportingPage() {
  // Primary date range state - used throughout the component
  const [dateRange, setDateRange] = useState<string>("week");
  // Get history data from app state
  const { user } = useLoaderData({ from: rootRoute.id });
  const reportingLoaderData = useLoaderData({ from: reportingRoute.id }) as any;
  const macroData = reportingLoaderData?.macroData;
  const history = macroData?.history || [];

  const {
    isLoading,
    error,
    fetchWeightGoals,
    macroTarget,
    weightGoals,
    nutritionProfile,
    setSubscriptionStatus,
  } = useStore();
  // Hydrate subscriptionStatus from loader user.subscription.status
  useEffect(() => {
    if (
      user &&
      user.subscription &&
      typeof user.subscription.status === "string"
    ) {
      setSubscriptionStatus(user.subscription.status);
    }
  }, [user, setSubscriptionStatus]);

  // Use the reporting logic hook to handle all data processing

  const {
    aggregatedData,
    dataProcessed,
    averages,
    handleDownloadCSV,
    getDateRangeISOStrings,
    mapDateRangeToNumeric,
  } = useReportingLogic(history, dateRange, isLoading);

  // Macro density breakdown chart data (percentages)
  const macroDensityData = useMacroDensityBreakdown(history, dateRange);

  // Fetch weight goals on component mount if needed
  useEffect(() => {
    fetchWeightGoals();
  }, [fetchWeightGoals]);

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
          {isLoading ? (
            <ReportingPageSkeleton />
          ) : (
            <>
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
              {!isLoading &&
                !error &&
                history?.length === 0 &&
                dataProcessed && (
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
              <ProFeature>
                <DateRangeSelector
                  currentRange={dateRange}
                  onRangeChange={setDateRange}
                  onExportClick={handleDownloadCSV}
                  isExportDisabled={aggregatedData.length === 0 || isLoading}
                />
              </ProFeature>
              {/* Summary Stats */}
              {(() => {
                const calorieTarget =
                  weightGoals?.calorieTarget || nutritionProfile?.tdee || 2000;
                return (
                  <MacroSummaryStats
                    data={aggregatedData}
                    calorieTarget={calorieTarget}
                    macroTarget={macroTarget}
                  />
                );
              })()}
              {/* Mobile-optimized: MealTimeBreakdown and MacroDensityBreakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="order-2 md:order-1">
                  {/* MealTimeBreakdown expects raw history and ISO date strings for filtering */}
                  {(() => {
                    const { startDate, endDate } =
                      getDateRangeISOStrings(dateRange);
                    return (
                      <MealTimeBreakdown
                        history={history}
                        startDate={startDate}
                        endDate={endDate}
                      />
                    );
                  })()}
                </div>
                <div className="order-1 md:order-2">
                  {/* MacroDensityBreakdown expects pre-aggregated macro density data and numeric range */}
                  <MacroDensityBreakdown
                    data={macroDensityData}
                    selectedRange={mapDateRangeToNumeric(dateRange)}
                    isLoading={isLoading}
                    dataProcessed={dataProcessed}
                  />
                </div>
              </div>
              {/* Charts */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <ProFeature>
                  <motion.div
                    layout
                    className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-4 shadow-xl"
                  >
                    <h2 className="text-lg font-semibold text-gray-200 mb-6">
                      Calorie Intake
                    </h2>
                    <div className="h-80 ">
                      <LineChartComponent
                        data={aggregatedData}
                        lines={calorieChartLines}
                        isLoading={isLoading || !dataProcessed}
                        showNoDataMessage={showNoDataMessage}
                      />
                    </div>
                  </motion.div>
                </ProFeature>
                <ProFeature>
                  <motion.div
                    layout
                    className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-4 shadow-xl"
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
                </ProFeature>
              </div>{" "}
              {/* Unified Insights Dashboard */}
              <div className="mb-6">
                {" "}
                <ProFeature>
                  <UnifiedInsights
                    aggregatedData={aggregatedData}
                    averages={averages}
                    isLoading={isLoading}
                    showNoDataMessage={showNoDataMessage}
                    macroTarget={macroTarget}
                  />
                </ProFeature>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
