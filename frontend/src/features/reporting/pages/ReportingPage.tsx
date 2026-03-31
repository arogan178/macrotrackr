import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { AnimatePresence, motion } from "motion/react";

import { macrosApi } from "@/api/macros";
import { ProFeature } from "@/components/billing";
import { DateRangeSelector } from "@/components/chart";
import { DashboardPageContainer } from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import { EmptyState } from "@/components/ui";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useWeightGoals } from "@/hooks/queries/useGoals";
import {
  useMacroHistoryForDateRange,
  useMacroTarget,
} from "@/hooks/queries/useMacroQueries";
import { useMacroDensitySummary } from "@/hooks/queries/useReportingQueries";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { queryKeys } from "@/lib/queryKeys";
import { useStore } from "@/store/store";

import {
  MacroDensityBreakdown,
  MacroSummaryStats,
  MealTimeBreakdown,
  ReportingPageSkeleton,
  TrendsChartSection,
  UnifiedInsights,
} from "../components";
import { useReportingLogic } from "../hooks/useReportingLogic";
import { getDateRangeData, mapDateRangeToNumeric } from "../utils";

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
      getDateRangeData("month");
    const { startDate: threeMonthsStart, endDate: threeMonthsEnd } =
      getDateRangeData("3months");

    queryClient.prefetchQuery({
      queryKey: queryKeys.macros.historyRange(monthStart, monthEnd),
      queryFn: async () => {
        const response = await macrosApi.getHistory({
          limit: 10_000,
          offset: 0,
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
        const response = await macrosApi.getHistory({
          limit: 10_000,
          offset: 0,
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
  const { startDate, endDate } = getDateRangeData(dateRange);

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
    isHistoryReady,
    averages,
    handleDownloadCSV,
  } = useReportingLogic(history, dateRange, isHistoryLoading);

  // Macro density breakdown chart data (percentages) fetched from backend reporting API
  const densityGroupBy = dateRange === "week" ? "day" : (dateRange === "month" ? "week" : "month");
  const { data: macroDensityData = [] } = useMacroDensitySummary(startDate, endDate, densityGroupBy);

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
    !isHistoryLoading && isHistoryReady && aggregatedData.length === 0;

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

                  {showNoDataMessage ? (
                    <div className="rounded-2xl border border-border/60 bg-surface/70 shadow-sm">
                      <EmptyState
                        title="No reporting data yet"
                        message="Add a few meals to unlock analytics, macro trends, and meal timing insights for the selected range."
                        size="md"
                      />
                    </div>
                  ) : (
                    <>
                      {(() => {
                        const calorieTarget = weightGoals?.calorieTarget ?? 2000;

                        return (
                          <MacroSummaryStats
                            data={aggregatedData}
                            calorieTarget={calorieTarget}
                            macroTarget={macroTarget ?? undefined}
                          />
                        );
                      })()}

                      <ProFeature>
                        <TrendsChartSection
                          dailySeries={dailySeries}
                          isHistoryLoading={isHistoryLoading}
                          isHistoryReady={isHistoryReady}
                          calorieChartLines={calorieChartLines}
                          macroChartLines={macroChartLines}
                        />
                      </ProFeature>

                      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                        <motion.div
                          className="flex w-full min-w-0"
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -12 }}
                          transition={{ duration: 0.25, ease: "easeOut" }}
                          layout
                        >
                          {(() => {
                            const { startDate: rangeStart, endDate: rangeEnd } =
                              getDateRangeData(dateRange);

                            return (
                              <div className="w-full">
                                <MealTimeBreakdown
                                  history={history}
                                  startDate={rangeStart}
                                  endDate={rangeEnd}
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
                              isHistoryReady={isHistoryReady}
                            />
                          </div>
                        </motion.div>
                      </div>

                      <ProFeature>
                        <UnifiedInsights
                          aggregatedData={aggregatedData}
                          averages={averages}
                          isLoading={isHistoryLoading}
                          showNoDataMessage={showNoDataMessage}
                          macroTarget={macroTarget ?? undefined}
                          denominatorDays={mapDateRangeToNumeric(dateRange)}
                          dailySeriesForRange={dailySeries}
                        />
                      </ProFeature>
                    </>
                  )}
                </div>
              )}
            </motion.div>
          }
        </AnimatePresence>
      </FeaturePage>
    </DashboardPageContainer>
  );
}
