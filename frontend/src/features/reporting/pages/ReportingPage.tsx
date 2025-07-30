import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";

import { ProFeature } from "@/components/billing";
import { DateRangeSelector, LineChartComponent } from "@/components/chart";
import FeaturePage from "@/components/layout/FeaturePage";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useWeightGoals } from "@/hooks/queries/useGoals";
import {
  useMacroHistoryForDateRange,
  useMacroTarget,
} from "@/hooks/queries/useMacroQueries";
import { usePageDataSync } from "@/hooks/usePageDataSync";
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

  // Get user data from useUser hook
  const { data: user } = useUser();

  // Calculate date range for the selected period
  const getDateRangeISOStrings = (range: string) => {
    const today = new Date();
    const endDateString = today.toISOString().split("T")[0];
    let days = 7;
    if (range === "month") days = 30;
    if (range === "3months") days = 90;
    const startDateObject = new Date(today);
    startDateObject.setDate(today.getDate() - (days - 1));
    const startDateString = startDateObject.toISOString().split("T")[0];
    return { startDate: startDateString, endDate: endDateString };
  };

  const { startDate, endDate } = getDateRangeISOStrings(dateRange);

  // Use TanStack Query hooks for data fetching
  const { data: weightGoals } = useWeightGoals();
  const { data: macroTarget } = useMacroTarget();
  const { data: history = [], isLoading: isHistoryLoading } =
    useMacroHistoryForDateRange(startDate, endDate);

  const { nutritionProfile } = useStore();

  // Centralize subscription status hydration
  usePageDataSync();

  // Use the reporting logic hook to handle all data processing
  const {
    aggregatedData,
    dataProcessed,
    averages,
    handleDownloadCSV,
    mapDateRangeToNumeric,
  } = useReportingLogic(history, dateRange, isHistoryLoading);

  // Macro density breakdown chart data (percentages)
  const macroDensityData = useMacroDensityBreakdown(history, dateRange);

  // Define chart configurations for the new component
  const calorieChartLines = [
    { dataKey: "calories", name: "Calories", color: "hsl(231, 77%, 66%)" }, // vibrant-accent approx
  ];

  const macroChartLines = [
    { dataKey: "protein", name: "Protein (g)", color: "hsl(145, 63%, 49%)" }, // green-500 approx
    { dataKey: "carbs", name: "Carbs (g)", color: "hsl(217, 91%, 60%)" }, // blue-500 approx
    { dataKey: "fats", name: "Fats (g)", color: "hsl(0, 84%, 60%)" }, // red-500 approx
  ];

  const showNoDataMessage =
    !isHistoryLoading && dataProcessed && aggregatedData.length === 0;

  return (
    <FeaturePage
      feature="reports"
      title="Nutrition Reports"
      subtitle="Track your nutrition trends and progress over time"
    >
      <AnimatePresence mode="wait">
        {
          <motion.div
            key="reporting-main-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            {isHistoryLoading ? (
              <ReportingPageSkeleton />
            ) : (
              <>
                {/* Debug info for development - Adjusted condition */}
                {!isHistoryLoading &&
                  history?.length === 0 &&
                  dataProcessed && (
                    <div className="mb-6 text-warning bg-warning/30 p-4 rounded-lg border border-yellow-800/30 shadow-primary">
                      <div className="flex items-center">
                        <svg
                          className="h-5 w-5 mr-2 text-warning"
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
                    isExportDisabled={
                      aggregatedData.length === 0 || isHistoryLoading
                    }
                  />
                </ProFeature>
                {/* Summary Stats */}
                {(() => {
                  const calorieTarget =
                    weightGoals?.calorieTarget ||
                    nutritionProfile?.tdee ||
                    2000;
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
                      isLoading={isHistoryLoading}
                      dataProcessed={dataProcessed}
                    />
                  </div>
                </div>
                {/* Charts */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <ProFeature>
                    <motion.div
                      layout
                      className="bg-surface/70 rounded-xl border border-border/50 p-4 shadow-modal"
                    >
                      <h2 className="text-lg font-semibold text-foreground mb-6">
                        Calorie Intake
                      </h2>
                      <div className="h-80 ">
                        <LineChartComponent
                          data={aggregatedData}
                          lines={calorieChartLines}
                          isLoading={isHistoryLoading || !dataProcessed}
                          showNoDataMessage={showNoDataMessage}
                        />
                      </div>
                    </motion.div>
                  </ProFeature>
                  <ProFeature>
                    <motion.div
                      layout
                      className="bg-surface/70 rounded-xl border border-border/50 p-4 shadow-modal"
                    >
                      <h2 className="text-lg font-semibold text-foreground mb-6">
                        Macronutrient Intake
                      </h2>
                      <div className="h-80">
                        <LineChartComponent
                          data={aggregatedData}
                          lines={macroChartLines}
                          isLoading={isHistoryLoading || !dataProcessed}
                          showNoDataMessage={showNoDataMessage}
                        />
                      </div>
                    </motion.div>
                  </ProFeature>
                </div>
                {/* Unified Insights Dashboard */}
                <div className="mb-6">
                  <ProFeature>
                    <UnifiedInsights
                      aggregatedData={aggregatedData}
                      averages={averages}
                      isLoading={isHistoryLoading}
                      showNoDataMessage={showNoDataMessage}
                      macroTarget={macroTarget}
                    />
                  </ProFeature>
                </div>
              </>
            )}
          </motion.div>
        }
      </AnimatePresence>
    </FeaturePage>
  );
}
