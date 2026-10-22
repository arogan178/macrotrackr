import { useMemo } from "react";
import { motion } from "motion/react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import CardContainer from "@/components/form/CardContainer";
import { Heading, LoadingSpinner, Panel } from "@/components/ui";
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
              title="Consistency"
              tooltipText="Measures how often you log and how steady your daily calories are."
              score={consistencyScore}
              delay={0}
            >
              <div className="flex flex-1 items-center gap-6 pt-3">
                <div className="shrink-0">
                  <RadialProgress
                    progress={consistencyScore}
                    size={96}
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
                {/* How the score was earned, beside it: four figures, no boxes or icons. */}
                <dl className="grid flex-1 grid-cols-2 gap-x-6 gap-y-3">
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
                    <div key={stat.label} className="flex min-w-0 flex-col">
                      <dt className="order-last mt-0.5 truncate text-xs text-muted">{stat.label}</dt>
                      <dd>
                        <Value value={stat.value} unit={stat.unit} size="stat" />
                      </dd>
                    </div>
                  ))}
                </dl>
              </div>
              <p className="mt-3 text-xs text-muted">{dataQuality.message}</p>
            </MetricCard>
          </div>

          {/* Macro Balance */}
          <div className="lg:col-span-2">
            <MetricCard
              title="Macro balance"
              tooltipText="Shows how close your current intake of Protein, Carbs, and Fats aligns with your set targets."
              delay={0.1}
            >
              <div className="flex flex-1 flex-col justify-center pt-2">
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
                          size={96}
                          strokeWidth={8}
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

        {/* Trends get the full width, one column per figure. */}
        <div className="col-span-1 md:col-span-3">
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
            <Panel flatOnPhone className="flex h-full flex-col">
              <div className="mb-4 flex items-center gap-2">
                <Heading level="panel" as="h3">
                  Trends
                </Heading>
                <InfoTooltip text="Compares average intake in the initial part of the selected range against recent days to show trajectory." />
              </div>

              {/* Rows divided by hairlines, not four boxes inside a box. */}
              <div className="grid flex-1 grid-cols-1 border-t border-border sm:grid-cols-2 sm:gap-x-6 lg:grid-cols-4">
                <TrendDisplay
                  label="Calories"
                  trend={caloriesTrend}
                  data={aggregatedData}
                  dataKey="calories"
                  icon={<span className="h-2 w-2 rounded-full bg-primary" />}
                  unit="kcal"
                />
                <TrendDisplay
                  label="Protein"
                  trend={proteinTrend}
                  data={aggregatedData}
                  dataKey="protein"
                  icon={<span className="h-2 w-2 rounded-full bg-protein" />}
                  unit="g"
                />
                <TrendDisplay
                  label="Carbs"
                  trend={carbsTrend}
                  data={aggregatedData}
                  dataKey="carbs"
                  icon={<span className="h-2 w-2 rounded-full bg-carbs" />}
                  unit="g"
                />
                <TrendDisplay
                  label="Fats"
                  trend={fatsTrend}
                  data={aggregatedData}
                  dataKey="fats"
                  icon={<span className="h-2 w-2 rounded-full bg-fats" />}
                  unit="g"
                />
              </div>

              <p className="mt-4 text-xs leading-relaxed text-muted">
                {overallTrendMessage}
              </p>
            </Panel>
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
