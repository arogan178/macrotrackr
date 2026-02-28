import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useMemo, useState } from "react";

import { ProFeature } from "@/components/billing";
import { DateRangeSelector } from "@/components/chart";
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
import { useStore } from "@/store/store";
import { apiService } from "@/utils/apiServices";

import {
  MacroDensityBreakdown,
  MacroSummaryStats,
  MealTimeBreakdown,
  ReportingPageSkeleton,
  UnifiedInsights,
} from "../components";
import TrendsChartSection from "../components/TrendsChartSection";
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

  // Get subscription status from store
  const { subscriptionStatus } = useStore();
  const isProUser = subscriptionStatus === "pro";

  // Primary date range state - used throughout the component
  const [dateRange, setDateRange] = useState<string>("week");

  // Redirect to week view if free user tries to access Pro ranges
  const handleRangeChange = (range: string) => {
    if (!isProUser && range !== "week") {
      return; // Don't allow free users to select Pro ranges
    }
    setDateRange(range);
  };

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
      { dataKey: "calories", name: "Calories", color: "hsl(231, 77%, 66%)", isArea: true }, // vibrant-accent approx
    ],
    [],
  );

  const macroChartLines = useMemo(
    () => [
      { dataKey: "protein", name: "Protein (g)", color: "hsl(145, 63%, 49%)", isArea: true }, // green-500 approx
      { dataKey: "carbs", name: "Carbs (g)", color: "hsl(217, 91%, 60%)", isArea: true }, // blue-500 approx
      { dataKey: "fats", name: "Fats (g)", color: "hsl(0, 84%, 60%)", isArea: true }, // red-500 approx
    ],
    [],
  );

  const showNoDataMessage =
    !isHistoryLoading && dataProcessed && aggregatedData.length === 0;

  const headerTitle = "Analytics";
  const headerSubtitle = "Deep dive into your nutrition patterns and progress";

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
                <div className="flex flex-col gap-6">
                  {/* Debug info for development - Adjusted condition */}
                  {!isHistoryLoading &&
                    history?.length === 0 &&
                    dataProcessed && (
                      <div className="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-sm text-warning">
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
                  <DateRangeSelector
                    currentRange={dateRange}
                    onRangeChange={handleRangeChange}
                    onExportClick={handleDownloadCSV}
                    isExportDisabled={
                      aggregatedData.length === 0 || isHistoryLoading
                    }
                    disabledRanges={isProUser ? [] : ["month", "3months"]}
                    isPro={isProUser}
                  />

                  {/* Summary Stats Grid */}
                  {(() => {
                    const calorieTarget = weightGoals?.calorieTarget || 2000;
                    return (
                      <MacroSummaryStats
                        data={aggregatedData}
                        calorieTarget={calorieTarget}
                        macroTarget={macroTarget || undefined}
                      />
                    );
                  })()}

                  {/* Main Trends Chart */}
                  <ProFeature>
                    <TrendsChartSection
                      dailySeries={dailySeries}
                      isHistoryLoading={isHistoryLoading}
                      dataProcessed={dataProcessed}
                      calorieChartLines={calorieChartLines}
                      macroChartLines={macroChartLines}
                    />
                  </ProFeature>

                  {/* Distribution Side-by-Side */}
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <motion.div
                      className="flex w-full min-w-0"
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
                          <div className="w-full">
                            <MealTimeBreakdown
                              history={history}
                              startDate={startDate}
                              endDate={endDate}
                            />
                          </div>
                        );
                      })()}
                    </motion.div>
                    <motion.div
                      className="flex w-full min-w-0"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -12 }}
                      transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
                      layout
                    >
                      <div className="w-full">
                        <MacroDensityBreakdown
                          data={macroDensityData}
                          selectedRange={mapDateRangeToNumeric(dateRange)}
                          isLoading={isHistoryLoading}
                          dataProcessed={dataProcessed}
                        />
                      </div>
                    </motion.div>
                  </div>

                  {/* Unified Insights Dashboard (Bottom Section) */}
                  <ProFeature>
                    <UnifiedInsights
                      aggregatedData={aggregatedData}
                      averages={averages}
                      isLoading={isHistoryLoading}
                      showNoDataMessage={showNoDataMessage}
                      macroTarget={macroTarget || undefined}
                      denominatorDays={mapDateRangeToNumeric(dateRange)}
                      dailySeriesForRange={dailySeries}
                    />
                  </ProFeature>
                </div>
              )}
            </motion.div>
          }
        </AnimatePresence>
      </FeaturePage>
    </DashboardPageContainer>
  );
}
