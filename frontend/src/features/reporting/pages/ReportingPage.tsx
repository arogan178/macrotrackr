import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { ProFeature } from "@/components/billing";
import {
  ChartCard,
  DateRangeSelector,
  LineChartComponent,
} from "@/components/chart";
import { DashboardPageContainer } from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useWeightGoals } from "@/hooks/queries/useGoals";
import {
  useMacroHistoryForDateRange,
  useMacroTarget,
} from "@/hooks/queries/useMacroQueries";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { queryKeys } from "@/lib/queryKeys";
import { apiService } from "@/utils/apiServices";

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
  const queryClient = useQueryClient();

  // Primary date range state - used throughout the component
  const [dateRange, setDateRange] = useState<string>("week");

  // Prefetch other date ranges on mount for faster tab switching
  useEffect(() => {
    const { startDate: monthStart, endDate: monthEnd } =
      getDateRangeISOStrings("month");
    const { startDate: threeMonthsStart, endDate: threeMonthsEnd } =
      getDateRangeISOStrings("3months");

    queryClient.prefetchQuery({
      queryKey: queryKeys.macros.historyRange(monthStart, monthEnd),
      queryFn: async () => {
        const response = await apiService.macros.getHistory(10_000, 0, {
          startDate: monthStart,
          endDate: monthEnd,
        });
        return (response as { entries: unknown[] }).entries;
      },
    });

    queryClient.prefetchQuery({
      queryKey: queryKeys.macros.historyRange(
        threeMonthsStart,
        threeMonthsEnd,
      ),
      queryFn: async () => {
        const response = await apiService.macros.getHistory(10_000, 0, {
          startDate: threeMonthsStart,
          endDate: threeMonthsEnd,
        });
        return (response as { entries: unknown[] }).entries;
      },
    });
  }, [queryClient]);

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
                      <div className="mb-4 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
                        <div className="flex items-center gap-2">
                          <svg
                            className="h-4 w-4 shrink-0 text-warning"
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
                          <span>
                            No nutrition history found. Add some entries to see
                            your reporting data.
                          </span>
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
                      <ChartCard
                        title="Calorie Intake"
                        className="h-100"
                        minHeight={300}
                      >
                        <LineChartComponent
                          data={dailySeries}
                          lines={calorieChartLines}
                          isLoading={isHistoryLoading || !dataProcessed}
                          showNoDataMessage={chartShowNoDataMessage}
                        />
                      </ChartCard>
                    </ProFeature>
                    <ProFeature>
                      <ChartCard
                        title="Macronutrient Intake"
                        className="h-100"
                        minHeight={300}
                      >
                        <LineChartComponent
                          data={dailySeries}
                          lines={macroChartLines}
                          isLoading={isHistoryLoading || !dataProcessed}
                          showNoDataMessage={chartShowNoDataMessage}
                        />
                      </ChartCard>
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
                        dailySeriesForRange={dailySeries}
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
