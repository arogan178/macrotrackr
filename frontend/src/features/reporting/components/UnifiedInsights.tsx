import { motion } from "motion/react";
import { useMemo } from "react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { CardContainer } from "@/components/form";
import { CalendarIcon, LoadingSpinner, ProgressBar } from "@/components/ui";

import {
  MACRO_COLORS,
  SECTION_STYLES,
} from "../constants";
import type { UnifiedInsightsProps as UnifiedInsightsProps } from "../types/insightsTypes";
import {
  calculateConsistencyScore,
  calculateDataQuality,
  calculateMacroBalance,
  calculateMacroDensity,
  calculateTrend,
} from "../utils/insightsCalculations";
import {
  BAR_BASE_CLASSES,
  getColorByScore,
  parseMacroRatio,
  SECTION_HEADING_CLASSES,
  STAGGER,
  SUBTEXT_MUTED_CLASSES,
  TRANSITIONS,
} from "../utils/unifiedInsightsUtilities";
import MetricCard from "./MetricCard";
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

      return {
        consistencyScore: calculateConsistencyScore(
          Array.isArray(dailySeriesForRange)
            ? dailySeriesForRange
            : aggregatedData,
          denominator,
        ),
        macroBalance: calculateMacroBalance(averages, macroTarget),
        caloriesTrend: calculateTrend(aggregatedData, "calories"),
        proteinTrend: calculateTrend(aggregatedData, "protein"),
        dataQuality: calculateDataQuality(dataForQuality as any, denominator),
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
      <div className="flex min-h-60 items-center justify-center rounded-xl border border-border bg-surface p-6 text-foreground">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle no data state
  if (!insights || aggregatedData.length === 0 || showNoDataMessage) {
    return (
      <div className="flex min-h-60 items-center justify-center rounded-xl border border-border bg-surface p-6 text-center">
        <div className="space-y-3">
          <div className="text-4xl">Insights</div>
          <div>
            <p className="mb-2 text-xl font-semibold text-foreground">
              Ready for Insights
            </p>
            <p className="max-w-md text-muted">
              Start logging your meals to unlock personalized nutrition
              insights, trends, and recommendations tailored just for you.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const {
    consistencyScore,
    macroBalance,
    caloriesTrend,
    proteinTrend,
    dataQuality,
    macroDensity,
  } = insights;

  return (
    <CardContainer className="p-6">
      <h2 className={`mb-6 ${SECTION_HEADING_CLASSES}`}>Nutrition Insights</h2>

      {/* Top metrics grid - key performance indicators */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-3">
        {/* Consistency Score */}
        <MetricCard
          title="Consistency Score"
          value={consistencyScore}
          subtitle="out of 100"
          score={consistencyScore}
          delay={0}
        >
          <div className="flex h-full flex-col">
            <div className="mb-2 flex items-center justify-between text-xs tracking-wider text-muted uppercase">
              <span>Logging frequency</span>
              <span>Intake variation</span>
            </div>
            <ProgressBar
              progress={consistencyScore}
              color="accent"
              height="lg"
              className={BAR_BASE_CLASSES}
              fillClass={getColorByScore(consistencyScore, "consistency")}
              aria-label="Consistency score"
            />
          </div>
        </MetricCard>
        {/* Macro Balance */}
        <MetricCard
          title="Macro Balance"
          value={macroBalance.score}
          subtitle="P/C/F Balance"
          score={macroBalance.score}
          delay={0.1}
        >
          <div className="flex h-full flex-col justify-between">
            <div className="mb-2 flex justify-between text-xs tracking-wider text-muted uppercase">
              <span>Current: {macroBalance.currentRatio}</span>
              <span>Target: {macroBalance.idealRatio}</span>
            </div>
            <div>
              {(() => {
                const parts = parseMacroRatio(macroBalance.currentRatio);
                return (
                  <>
                    <div
                      className="flex h-2 overflow-hidden rounded-full bg-surface"
                      role="img"
                      aria-label={`Macro ratio current ${macroBalance.currentRatio} target ${macroBalance.idealRatio}`}
                    >
                      {parts.map((pct, index) => {
                        const colors = [
                          MACRO_COLORS.protein.bar,
                          MACRO_COLORS.carbs.bar,
                          MACRO_COLORS.fats.bar,
                        ];
                        return (
                          <div
                            key={index}
                            className={`${colors[index]} h-full transition-all duration-1000`}
                            style={{ width: `${pct}%` }}
                          />
                        );
                      })}
                    </div>
                    <div
                      className={`mt-1 flex justify-between ${SUBTEXT_MUTED_CLASSES}`}
                    >
                      {parts.map((pct, index) => {
                        const labels = ["Protein", "Carbs", "Fats"];
                        const colors = [
                          MACRO_COLORS.protein.text,
                          MACRO_COLORS.carbs.text,
                          MACRO_COLORS.fats.text,
                          ];
                        return (
                          <span key={index} className={colors[index]}>
                            {labels[index]}: {pct}%
                          </span>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        </MetricCard>
        {/* Nutrient Density */}
        <MetricCard
          title="Nutrient Density"
          value={macroDensity.score}
          subtitle="quality score"
          score={macroDensity.score}
          delay={0.2}
        >
          <div className="flex h-full flex-col">
            <div className="mb-2 flex items-center justify-between text-xs tracking-wider text-muted uppercase">
              <span>Protein quality</span>
              <span>Macro balance</span>
            </div>
            <ProgressBar
              progress={macroDensity.score}
              color="green"
              height="lg"
              className={BAR_BASE_CLASSES}
              fillClass={getColorByScore(macroDensity.score, "density")}
              aria-label="Nutrient density score"
            />
          </div>
        </MetricCard>
      </div>

      {/* Detailed insights section */}
      <div className="mt-8 space-y-6">
        {/* Trend Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: TRANSITIONS.duration,
            ease: TRANSITIONS.ease,
            delay: STAGGER.sectionTrend,
          }}
          className={SECTION_STYLES.trendAnalysis}
          aria-label="Trend analysis"
        >
          <h3 className="mb-4 text-lg font-semibold tracking-tight text-foreground/90">
            Trend Analysis
          </h3>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TrendDisplay label="Calories" trend={caloriesTrend} />
            <TrendDisplay label="Protein" trend={proteinTrend} />
          </div>
        </motion.div>

        {/* Tracking Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: TRANSITIONS.duration,
            ease: TRANSITIONS.ease,
            delay: STAGGER.sectionTracking,
          }}
          className={SECTION_STYLES.trackingAnalysis}
          aria-label="Tracking analysis"
        >
          <h3 className="mb-4 text-lg font-semibold tracking-tight text-foreground/90">
            Tracking Analysis
          </h3>
          <div className="flex flex-col justify-between sm:flex-row sm:items-center">
            <div className="mb-2 sm:mb-0">
              <span className="text-foreground">
                <AnimatedNumber
                  value={
                    typeof dataQuality.completionRate === "number"
                      ? dataQuality.completionRate
                      : 0
                  }
                  toFixedValue={0}
                  suffix="% tracking completion rate"
                  duration={0.6}
                />
              </span>
              <div className="mt-1 w-full sm:w-40">
                <ProgressBar
                  progress={dataQuality.completionRate}
                  color="blue"
                  height="md"
                  fillClass="bg-primary"
                  className="overflow-hidden rounded-full bg-surface"
                  aria-label="Tracking completion rate"
                />
              </div>
            </div>
            <div className="flex items-center text-foreground">
              <CalendarIcon className="mr-1" />
              <span>
                <AnimatedNumber
                  value={
                    typeof dataQuality.daysLogged === "number"
                      ? dataQuality.daysLogged
                      : 0
                  }
                  toFixedValue={0}
                  duration={0.5}
                />
                /
                <AnimatedNumber
                  value={
                    typeof dataQuality.totalDaysInPeriod === "number"
                      ? dataQuality.totalDaysInPeriod
                      : 0
                  }
                  toFixedValue={0}
                  duration={0.5}
                />
                {" days logged"}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm text-muted">{dataQuality.message}</p>
        </motion.div>

        {/* Recommendations */}
        <RecommendationsSection insights={insights} averages={averages} />
      </div>
    </CardContainer>
  );
}

export default UnifiedInsights;
