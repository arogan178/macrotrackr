import { useMemo } from "react";
import { motion } from "motion/react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import CardContainer from "@/components/form/CardContainer";
import {
  CalorieIcon,
  DropletIcon,
  DrumstickIcon,
  Heading,
  LoadingSpinner,
  WheatIcon,
} from "@/components/ui";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import MetricCard from "@/components/ui/MetricCard";
import { RadialProgress } from "@/components/ui/RadialProgress";
import Value from "@/components/ui/Value";

import { MACRO_COLORS } from "../constants";
import type { UnifiedInsightsProps } from "../types/insightsTypes";
import {
  calculateConsistencyScore,
  calculateDataQuality,
  calculateMacroBalance,
  calculateMacroDensity,
  calculateTrend,
  generateOverallTrendSummary,
} from "../utils/insightsCalculations";
import {
  getTextColorByScore,
  parseMacroRatio,
  STAGGER,
  TRANSITIONS,
} from "../utils/unifiedInsightsUtilities";

import RecommendationsSection from "./RecommendationsSection";
import TrendDisplay from "./TrendDisplay";

function UnifiedInsights({
  aggregatedData,
  averages,
  isLoading,
  showNoDataMessage = false,
  macroTarget,
  denominatorDays,
  dailySeriesForRange,
}: UnifiedInsightsProps) {
  // Calculate all insights metrics in one pass
  const insights = useMemo(() => {
    if (isLoading || !aggregatedData || aggregatedData.length === 0) {
      return;
    }
    try {
      // Prefer explicit denominatorDays prop (7/30/90 or custom inclusive count).
      const denominator =
        typeof denominatorDays === "number" && denominatorDays > 0
          ? denominatorDays
          : aggregatedData.length;

      // For 7/30/90 day ranges, use dailySeriesForRange if provided so
      // daysLogged reflects individual tracked days in the selected window.
      const dataForQuality = Array.isArray(dailySeriesForRange)
        ? dailySeriesForRange
        : aggregatedData;

      const caloriesTrend = calculateTrend(aggregatedData, "calories");
      const proteinTrend = calculateTrend(aggregatedData, "protein");
      const carbsTrend = calculateTrend(aggregatedData, "carbs");
      const fatsTrend = calculateTrend(aggregatedData, "fats");
      const overallTrendMessage = generateOverallTrendSummary(
        caloriesTrend,
        proteinTrend,
        carbsTrend,
        fatsTrend,
      );

      return {
        consistencyScore: calculateConsistencyScore(
          Array.isArray(dailySeriesForRange)
            ? dailySeriesForRange
            : aggregatedData,
          denominator,
        ),
        macroBalance: calculateMacroBalance(averages, macroTarget),
        caloriesTrend,
        proteinTrend,
        carbsTrend,
        fatsTrend,
        overallTrendMessage,
        dataQuality: calculateDataQuality(dataForQuality, denominator),
        macroDensity: calculateMacroDensity(averages),
      };
    } catch {
      // No return needed; fallthrough for no insights
    }
  }, [
    aggregatedData,
    averages,
    isLoading,
    macroTarget,
    denominatorDays,
    dailySeriesForRange,
  ]);

  // Handle loading state
  if (isLoading) {
    return (
      <CardContainer className="max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:px-0 flex min-h-[300px] items-center justify-center p-6 text-foreground">
        <LoadingSpinner />
      </CardContainer>
    );
  }

  // Handle no data state
  if (!insights || aggregatedData.length === 0 || showNoDataMessage) {
    return (
      <CardContainer className="max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:px-0 flex min-h-[300px] items-center justify-center p-6 text-center">
        <div>
          <p className="mb-2 text-xl font-semibold text-foreground">
            No data for this range
          </p>
          <p className="max-w-md text-muted">
            Log a few meals and your averages, trends and streaks will appear
            here.
          </p>
        </div>
      </CardContainer>
    );
  }

  const {
    consistencyScore,
    macroBalance,
    caloriesTrend,
    proteinTrend,
    carbsTrend,
    fatsTrend,
    overallTrendMessage,
    dataQuality,
  } = insights;

  return (
    <div className="flex flex-col gap-6">
      <Heading level="panel">Insights</Heading>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Top metrics grid - key performance indicators */}
        <div className="col-span-1 grid grid-cols-1 gap-6 md:col-span-3 lg:grid-cols-3">
          {/* Consistency Score */}
          <div className="lg:col-span-1">
            <MetricCard
              title="Consistency score"
              tooltipText="Measures how often you log and how steady your daily calories are."
              score={consistencyScore}
              delay={0}
            >
              <div className="flex h-full flex-col items-center justify-center pt-4 pb-2">
                <RadialProgress
                  progress={consistencyScore}
                  size={100}
                  strokeWidth={8}
                  colorClass={getTextColorByScore(
                    consistencyScore,
                    "consistency",
                  )}
                  trackColorClass="text-surface border border-border rounded-full"
                >
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      <AnimatedNumber
                        value={consistencyScore}
                        toFixedValue={0}
                        duration={0.8}
                      />
                    </span>
                    <span className="text-[10px] font-medium text-muted">
                      score
                    </span>
                  </div>
                </RadialProgress>
              </div>
            </MetricCard>
          </div>

          {/* Macro Balance */}
          <div className="lg:col-span-2">
            <MetricCard
              title="Macro balance"
              tooltipText="Shows how close your current intake of Protein, Carbs, and Fats aligns with your set targets."
              delay={0.1}
            >
              <div className="flex h-full flex-col justify-center pt-2">
                <div className="flex justify-around px-1 md:px-6">
                  {(() => {
                    const currentParts = parseMacroRatio(
                      macroBalance.currentRatio,
                    );
                    const targetParts = parseMacroRatio(
                      macroBalance.idealRatio,
                    );
                    const labels = ["Protein", "Carbs", "Fats"];
                    const colors = [
                      MACRO_COLORS.protein.text,
                      MACRO_COLORS.carbs.text,
                      MACRO_COLORS.fats.text,
                    ];

                    return currentParts.map((pct, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <RadialProgress
                          progress={pct}
                          size={80}
                          strokeWidth={6}
                          colorClass={colors[index]}
                          trackColorClass="text-surface border border-border rounded-full"
                        >
                          <span className="text-xl font-bold text-foreground">
                            {pct}%
                          </span>
                        </RadialProgress>
                        <span className="mt-2 text-xs font-medium text-muted">
                          {labels[index]}
                        </span>
                        <span className="text-[10px] text-muted/60">
                          target {targetParts[index]}%
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </MetricCard>
          </div>
        </div>

        {/* Tracking & Trend Analysis - 50/50 split */}
        <div className="col-span-1 grid grid-cols-1 gap-6 md:col-span-3 md:grid-cols-2">
          {/* Tracking Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: TRANSITIONS.duration,
              ease: TRANSITIONS.ease,
              delay: STAGGER.sectionTracking,
            }}
          >
            <CardContainer
              variant="interactive"
              className="flex h-full flex-col p-5 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:px-0"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold tracking-tight text-foreground">
                    Tracking
                  </h3>
                  <InfoTooltip text="Evaluates how regularly and completely you log your meals over the selected period." />
                </div>
              </div>

              {/* Four figures in a row, no boxes or icons: the numbers are the
                  point, and "7 of 7" used to be said three times. */}
              <dl className="grid grid-cols-4 divide-x divide-border border-y border-border">
                {[
                  { label: "Streak", value: dataQuality.currentStreak },
                  { label: "Best", value: dataQuality.longestStreak },
                  { label: "Missed", value: dataQuality.missedDays },
                  {
                    label: "Logged",
                    value:
                      typeof dataQuality.completionRate === "number"
                        ? dataQuality.completionRate
                        : 0,
                    unit: "%" as const,
                  },
                ].map((stat) => (
                  <div key={stat.label} className="flex min-w-0 flex-col px-2 py-3 first:pl-0">
                    <dt className="order-last mt-0.5 truncate text-xs text-muted">{stat.label}</dt>
                    <dd>
                      <Value value={stat.value} unit={stat.unit} size="stat" />
                    </dd>
                  </div>
                ))}
              </dl>

              <p className="mt-3 text-xs text-muted">{dataQuality.message}</p>
            </CardContainer>
          </motion.div>

          {/* Trend Analysis */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: TRANSITIONS.duration,
              ease: TRANSITIONS.ease,
              delay: STAGGER.sectionTrend,
            }}
          >
            <CardContainer
              variant="interactive"
              className="flex h-full flex-col p-5 max-md:rounded-none max-md:border-0 max-md:bg-transparent max-md:px-0"
            >
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-base font-semibold tracking-tight text-foreground">
                  Trends
                </h3>
                <InfoTooltip text="Compares average intake in the initial part of the selected range against recent days to show trajectory." />
              </div>

              {/* 2x2 Grid of Trend Cards */}
              <div className="grid flex-1 grid-cols-1 gap-2.5 sm:grid-cols-2 sm:gap-3">
                <TrendDisplay
                  label="Calories"
                  trend={caloriesTrend}
                  data={aggregatedData}
                  dataKey="calories"
                  icon={<CalorieIcon className="h-4 w-4 text-warning" />}
                  iconBgColor="bg-warning/10"
                  unit="kcal"
                />
                <TrendDisplay
                  label="Protein"
                  trend={proteinTrend}
                  data={aggregatedData}
                  dataKey="protein"
                  icon={<DrumstickIcon className="h-4 w-4 text-protein" />}
                  iconBgColor="bg-protein/10"
                  unit="g"
                />
                <TrendDisplay
                  label="Carbs"
                  trend={carbsTrend}
                  data={aggregatedData}
                  dataKey="carbs"
                  icon={<WheatIcon className="h-4 w-4 text-carbs" />}
                  iconBgColor="bg-carbs/10"
                  unit="g"
                />
                <TrendDisplay
                  label="Fats"
                  trend={fatsTrend}
                  data={aggregatedData}
                  dataKey="fats"
                  icon={<DropletIcon className="h-4 w-4 text-fats" />}
                  iconBgColor="bg-fats/10"
                  unit="g"
                />
              </div>

              {/* Message Banner */}
              <div className="mt-4 rounded-control border border-primary/20 bg-primary/5 px-3 py-2">
                <p className="text-xs leading-relaxed font-medium text-primary/90">
                  {overallTrendMessage}
                </p>
              </div>
            </CardContainer>
          </motion.div>
        </div>

        {/* Recommendations - Full width at bottom */}
        <div className="col-span-1 md:col-span-3">
          <RecommendationsSection insights={insights} averages={averages} />
        </div>
      </div>
    </div>
  );
}

export default UnifiedInsights;
