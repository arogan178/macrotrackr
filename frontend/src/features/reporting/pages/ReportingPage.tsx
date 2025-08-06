import { AnimatePresence, motion } from "motion/react";
import { useMemo, useState } from "react";

import { ProFeature } from "@/components/billing";
import { DateRangeSelector, LineChartComponent } from "@/components/chart";
import { DashboardPageContainer } from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import Navbar from "@/components/layout/Navbar";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useWeightGoals } from "@/hooks/queries/useGoals";
import {
  useMacroHistoryForDateRange,
  useMacroTarget,
} from "@/hooks/queries/useMacroQueries";
import { usePageDataSync } from "@/hooks/usePageDataSync";

import {
  MacroDensityBreakdown,
  MacroSummaryStats,
  MealTimeBreakdown,
  ReportingPageSkeleton,
  UnifiedInsights,
} from "../components";
import { useMacroDensityBreakdown } from "../hooks/useMacroDensityBreakdown";
import { useReportingLogic } from "../hooks/useReportingLogic";

// Moved to outer scope to satisfy unicorn/consistent-function-scoping
function getDateRangeISOStrings(range: string) {
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

export default function ReportingPage() {
  // Primary date range state - used throughout the component
  const [dateRange, setDateRange] = useState<string>("week");

  // Get user data from useUser hook
  const { data: _user } = useUser();

  // Calculate date range for the selected period
  const { startDate, endDate } = getDateRangeISOStrings(dateRange);

  // Use TanStack Query hooks for data fetching
  const { data: weightGoals } = useWeightGoals();
  const { data: macroTarget } = useMacroTarget();
  const { data: history = [], isLoading: isHistoryLoading } =
    useMacroHistoryForDateRange(startDate, endDate);

  // Centralize subscription status hydration
  usePageDataSync();

  // Use the reporting logic hook to handle all data processing
  const {
    aggregatedData,
    dailySeries,
    dataProcessed,
    averages,
    handleDownloadCSV,
    mapDateRangeToNumeric,
  } = useReportingLogic(history, dateRange, isHistoryLoading);

  // Macro density breakdown chart data (percentages)
  const macroDensityData = useMacroDensityBreakdown(history, dateRange);

  // Define chart configurations for the new component (memoized for stable identity)
  const calorieChartLines = useMemo(
    () => [
      { dataKey: "calories", name: "Calories", color: "hsl(231, 77%, 66%)" }, // vibrant-accent approx
    ],
    [],
  );

  const macroChartLines = useMemo(
    () => [
      { dataKey: "protein", name: "Protein (g)", color: "hsl(145, 63%, 49%)" }, // green-500 approx
      { dataKey: "carbs", name: "Carbs (g)", color: "hsl(217, 91%, 60%)" }, // blue-500 approx
      { dataKey: "fats", name: "Fats (g)", color: "hsl(0, 84%, 60%)" }, // red-500 approx
    ],
    [],
  );

  const showNoDataMessage =
    !isHistoryLoading && dataProcessed && aggregatedData.length === 0;

  // For the line charts we now show daily data; compute a chart-specific empty state
  const chartShowNoDataMessage =
    !isHistoryLoading && dataProcessed && dailySeries.length === 0;

  const headerTitle = "Nutrition Reports";
  const headerSubtitle = "Track your nutrition trends and progress over time";

  return (
    <DashboardPageContainer>
      <Navbar />
      <FeaturePage title={headerTitle} subtitle={headerSubtitle}>
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
                      <div className="mb-6 rounded-lg border border-yellow-800/30 bg-warning/30 p-4 text-warning shadow-primary">
                        <div className="flex items-center">
                          <svg
                            className="mr-2 h-5 w-5 text-warning"
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
                          No nutrition history found. Add some entries to see
                          your reporting data.
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
                      /* tdee fallback removed: use available targets only */
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
                  <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <motion.div
                      className="order-2 md:order-1"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      layout
                    >
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
                    </motion.div>
                    <motion.div
                      className="order-1 md:order-2"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25, ease: "easeOut" }}
                      layout
                    >
                      {/* MacroDensityBreakdown expects pre-aggregated macro density data and numeric range */}
                      <MacroDensityBreakdown
                        data={macroDensityData}
                        selectedRange={mapDateRangeToNumeric(dateRange)}
                        isLoading={isHistoryLoading}
                        dataProcessed={dataProcessed}
                      />
                    </motion.div>
                  </div>
                  {/* Charts */}
                  <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                    <ProFeature>
                      <motion.div
                        layout
                        className="rounded-xl border border-border/50 bg-surface/70 p-4 shadow-modal"
                      >
                        <h2 className="mb-6 text-lg font-semibold text-foreground">
                          Calorie Intake
                        </h2>
                        <div className="h-80 ">
                          <LineChartComponent
                            data={dailySeries}
                            lines={calorieChartLines}
                            isLoading={isHistoryLoading || !dataProcessed}
                            showNoDataMessage={chartShowNoDataMessage}
                          />
                        </div>
                      </motion.div>
                    </ProFeature>
                    <ProFeature>
                      <motion.div
                        layout
                        className="rounded-xl border border-border/50 bg-surface/70 p-4 shadow-modal"
                      >
                        <h2 className="mb-6 text-lg font-semibold text-foreground">
                          Macronutrient Intake
                        </h2>
                        <div className="h-80">
                          <LineChartComponent
                            data={dailySeries}
                            lines={macroChartLines}
                            isLoading={isHistoryLoading || !dataProcessed}
                            showNoDataMessage={chartShowNoDataMessage}
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
                        denominatorDays={mapDateRangeToNumeric(dateRange)}
                      />
                    </ProFeature>
                  </div>
                </>
              )}
            </motion.div>
          }
        </AnimatePresence>
      </FeaturePage>
    </DashboardPageContainer>
  );
}
