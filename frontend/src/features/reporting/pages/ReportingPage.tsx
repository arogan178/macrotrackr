import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

import { macrosApi } from "@/api/macros";
import ProFeature from "@/components/billing/ProFeature";
import DateRangeSelector from "@/components/chart/DateRangeSelector";
import { DashboardPageContainer } from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import { StateCard } from "@/components/ui";
import { MacroSnapshotModal } from "@/features/macroTracking/components";
import type { MacroSnapshotData } from "@/features/macroTracking/utils/macroSnapshotCanvas";
import { useUser } from "@/hooks/auth/useAuthQueries";
import { useWeightGoals } from "@/hooks/queries/useGoals";
import {
  useMacroHistoryForDateRange,
  useMacroTargetQuery,
} from "@/hooks/queries/useMacroQueries";
import { useMacroDensitySummary } from "@/hooks/queries/useReportingQueries";
import { useEntitlements } from "@/hooks/useEntitlements";
import { usePageDataSync } from "@/hooks/usePageDataSync";
import { queryKeys } from "@/lib/queryKeys";
import {
  formatDateShort,
  getDateRangeData,
  mapDateRangeToDays,
} from "@/utils/dateUtilities";

import {
  MacroDensityBreakdown,
  MacroSummaryStats,
  MealTimeBreakdown,
  ReportingPageSkeleton,
  TrendsChartSection,
  UnifiedInsights,
} from "../components";
import { useReportingLogic } from "../hooks/useReportingLogic";

export default function ReportingPage() {
  const queryClient = useQueryClient();

  const { hasProAccess } = useEntitlements();

  // Primary date range state - used throughout the component
  const [dateRange, setDateRange] = useState<string>("week");
  const [isSnapshotOpen, setIsSnapshotOpen] = useState<boolean>(false);

  // Redirect to week view if free user tries to access Pro ranges
  const handleRangeChange = (range: string) => {
    if (!hasProAccess && range !== "week") {
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
      queryKey: queryKeys.macros.historyRange(threeMonthsStart, threeMonthsEnd),
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
  const { data: macroTarget } = useMacroTargetQuery();
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
    trackedDays,
    totalDays,
    handleDownloadCSV,
  } = useReportingLogic(history, dateRange, isHistoryLoading);

  // Macro density breakdown chart data (percentages) fetched from backend reporting API
  const densityGroupBy =
    dateRange === "week" ? "day" : dateRange === "month" ? "week" : "month";
  const { data: macroDensityData = [] } = useMacroDensitySummary(
    startDate,
    endDate,
    densityGroupBy,
  );

  // Define chart configurations for the new component (memoized for stable identity)
  const calorieChartLines = useMemo(
    () => [
      {
        dataKey: "calories",
        name: "Calories",
        color: "hsl(231, 77%, 66%)",
        isArea: true,
      }, // primary approx
    ],
    [],
  );

  const macroChartLines = useMemo(
    () => [
      {
        dataKey: "protein",
        name: "Protein (g)",
        color: "hsl(145, 63%, 49%)",
        isArea: true,
      }, // green-500 approx
      {
        dataKey: "carbs",
        name: "Carbs (g)",
        color: "hsl(217, 91%, 60%)",
        isArea: true,
      }, // blue-500 approx
      {
        dataKey: "fats",
        name: "Fats (g)",
        color: "hsl(0, 84%, 60%)",
        isArea: true,
      }, // red-500 approx
    ],
    [],
  );

  const showNoDataMessage =
    !isHistoryLoading && isHistoryReady && aggregatedData.length === 0;

  const reportingSnapshotData: MacroSnapshotData = useMemo(() => {
    const calTarget = weightGoals?.calorieTarget ?? 2000;
    const pTarget = macroTarget
      ? Math.round((calTarget * macroTarget.proteinPercentage) / 100 / 4)
      : 150;
    const cTarget = macroTarget
      ? Math.round((calTarget * macroTarget.carbsPercentage) / 100 / 4)
      : 200;
    const fTarget = macroTarget
      ? Math.round((calTarget * macroTarget.fatsPercentage) / 100 / 9)
      : 65;
    const compliance =
      totalDays > 0 ? Math.round((trackedDays / totalDays) * 100) : 0;
    const rangeLabel =
      dateRange === "week"
        ? "Weekly Summary"
        : dateRange === "month"
          ? "Monthly Summary"
          : "90-Day Overview";

    return {
      title: rangeLabel,
      dateLabel: `${formatDateShort(startDate)} - ${formatDateShort(endDate)}`,
      calories: averages.calories,
      calorieTarget: calTarget,
      protein: averages.protein,
      proteinTarget: pTarget,
      carbs: averages.carbs,
      carbsTarget: cTarget,
      fats: averages.fats,
      fatsTarget: fTarget,
      complianceScore: compliance,
      badgeLabel: `⚡ ${compliance}% Consistency`,
    };
  }, [
    weightGoals,
    macroTarget,
    totalDays,
    trackedDays,
    dateRange,
    startDate,
    endDate,
    averages,
  ]);

  const headerTitle = "Analytics";
  const headerSubtitle = "Deep dive into your nutrition patterns and progress";

  return (
    <DashboardPageContainer>
      <FeaturePage title={headerTitle} subtitle={headerSubtitle}>
        {isHistoryLoading ? (
          <ReportingPageSkeleton />
        ) : (
          <div className="flex flex-col gap-3.5 sm:gap-6">
            <DateRangeSelector
              currentRange={dateRange}
              onRangeChange={handleRangeChange}
              onExportClick={handleDownloadCSV}
              onShareClick={() => setIsSnapshotOpen(true)}
              isExportDisabled={aggregatedData.length === 0 || isHistoryLoading}
              disabledRanges={hasProAccess ? [] : ["month", "3months"]}
              isPro={hasProAccess}
            />

            {showNoDataMessage ? (
              <div className="rounded-card border border-border bg-surface">
                <StateCard
                  title="No reporting data yet"
                  message="No meals logged in this range. Add a few and your trends and meal timing will appear here."
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
                      trackedDays={trackedDays}
                      totalDays={totalDays}
                      averages={averages}
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

                <div className="grid grid-cols-1 gap-3.5 sm:gap-6 md:grid-cols-2">
                  <div className="flex w-full min-w-0">
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
                  </div>
                  <div className="flex w-full min-w-0">
                    <div className="w-full">
                      <MacroDensityBreakdown
                        data={macroDensityData}
                        selectedRange={mapDateRangeToDays(dateRange)}
                        isLoading={isHistoryLoading}
                        isHistoryReady={isHistoryReady}
                      />
                    </div>
                  </div>
                </div>

                <ProFeature>
                  <UnifiedInsights
                    aggregatedData={aggregatedData}
                    averages={averages}
                    isLoading={isHistoryLoading}
                    showNoDataMessage={showNoDataMessage}
                    macroTarget={macroTarget ?? undefined}
                    denominatorDays={mapDateRangeToDays(dateRange)}
                    dailySeriesForRange={dailySeries}
                  />
                </ProFeature>
              </>
            )}
          </div>
        )}

        <MacroSnapshotModal
          isOpen={isSnapshotOpen}
          onClose={() => setIsSnapshotOpen(false)}
          data={reportingSnapshotData}
        />
      </FeaturePage>
    </DashboardPageContainer>
  );
}
