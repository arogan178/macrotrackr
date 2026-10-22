import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useNavigate, useSearch } from "@tanstack/react-router";

import { macrosApi } from "@/api/macros";
import ProFeature from "@/components/billing/ProFeature";
import DateRangeSelector from "@/components/chart/DateRangeSelector";
import { DashboardPageContainer } from "@/components/layout/DashboardPageContainer";
import FeaturePage from "@/components/layout/FeaturePage";
import { Heading, IconButton, Panel, StateCard } from "@/components/ui";
import { DATE_RANGE_OPTIONS } from "@/components/utils";
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

  const navigate = useNavigate();
  const search = (useSearch({ strict: false }) ?? {}) as { range?: string };
  const requestedRange = search.range ?? "week";
  // Unknown ranges, and Pro ranges opened by free users, fall back to the week view.
  const dateRange =
    hasProAccess &&
    DATE_RANGE_OPTIONS.some((option) => option.value === requestedRange)
      ? requestedRange
      : "week";
  const [isSnapshotOpen, setIsSnapshotOpen] = useState<boolean>(false);

  const handleRangeChange = (range: string) => {
    if (!hasProAccess && range !== "week") {
      return; // Don't allow free users to select Pro ranges
    }
    navigate({ to: "/reporting", search: { range }, replace: true });
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
        color: "var(--color-primary)",
        isArea: true,
      },
    ],
    [],
  );

  const macroChartLines = useMemo(
    () => [
      {
        dataKey: "protein",
        name: "Protein (g)",
        color: "var(--color-protein)",
        isArea: true,
      },
      {
        dataKey: "carbs",
        name: "Carbs (g)",
        color: "var(--color-carbs)",
        isArea: true,
      },
      {
        dataKey: "fats",
        name: "Fats (g)",
        color: "var(--color-fats)",
        isArea: true,
      },
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
        ? "Weekly summary"
        : dateRange === "month"
          ? "Monthly summary"
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
      badgeLabel: `${compliance}% consistency`,
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
  const headerActions = (
    <div className="flex items-center gap-1">
      <IconButton
        variant="share"
        ariaLabel="Share macro snapshot"
        onClick={() => setIsSnapshotOpen(true)}
        disabled={aggregatedData.length === 0 || isHistoryLoading}
      />
      <IconButton
        variant="export"
        ariaLabel="Export data as CSV file"
        onClick={handleDownloadCSV}
        disabled={aggregatedData.length === 0 || isHistoryLoading}
      />
    </div>
  );

  return (
    <DashboardPageContainer>
      <FeaturePage
        title={headerTitle}
        headerChildren={headerActions}
        mobileHeader={
          <div className="flex items-center justify-between gap-3">
            <Heading level="page">{headerTitle}</Heading>
            {headerActions}
          </div>
        }
      >
        {isHistoryLoading ? (
          <ReportingPageSkeleton />
        ) : (
          <div className="flex flex-col gap-10 md:gap-6">
            <DateRangeSelector
              currentRange={dateRange}
              onRangeChange={handleRangeChange}
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
                {/* The averages beside the line they come from: what the
                    period added up to, and how it moved day to day. */}
                <div className="grid grid-cols-1 gap-10 md:grid-cols-5 md:gap-6">
                  <Panel flatOnPhone className="md:col-span-2">
                    <MacroSummaryStats
                      data={aggregatedData}
                      calorieTarget={weightGoals?.calorieTarget ?? 2000}
                      macroTarget={macroTarget ?? undefined}
                      trackedDays={trackedDays}
                      totalDays={totalDays}
                      averages={averages}
                      dailySeries={dailySeries}
                    />
                  </Panel>

                  <div className="min-w-0 md:col-span-3">
                    <ProFeature>
                      <TrendsChartSection
                        dailySeries={dailySeries}
                        isHistoryLoading={isHistoryLoading}
                        isHistoryReady={isHistoryReady}
                        calorieChartLines={calorieChartLines}
                        macroChartLines={macroChartLines}
                      />
                    </ProFeature>
                  </div>
                </div>

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
