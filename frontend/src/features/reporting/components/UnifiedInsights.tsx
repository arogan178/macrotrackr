import { motion } from "motion/react";
import { useMemo } from "react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

import {
  MACRO_COLORS,
  METRIC_CARD_CONFIGS,
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
  STAGGER,
} from "../utils/unifiedInsightsUtilities";
import AtAGlanceSection from "./AtAGlanceSection";
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

      return {
        consistencyScore: calculateConsistencyScore(aggregatedData),
        macroBalance: calculateMacroBalance(averages, macroTarget),
        caloriesTrend: calculateTrend(aggregatedData, "calories"),
        proteinTrend: calculateTrend(aggregatedData, "protein"),
        dataQuality: calculateDataQuality(aggregatedData, denominator),
        macroDensity: calculateMacroDensity(averages),
      };
    } catch {
      return null;
    }
  }, [aggregatedData, averages, isLoading, macroTarget, denominatorDays]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-border/50 bg-surface/70 p-6 text-foreground shadow-modal backdrop-blur-sm">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle no data state
  if (!insights || aggregatedData.length === 0 || showNoDataMessage) {
    return (
      <div className="flex min-h-[250px] items-center justify-center rounded-xl border border-border/50 bg-surface/70 p-6 text-center text-foreground shadow-modal backdrop-blur-sm">
        <div className="space-y-3">
          <div className="text-4xl">📊</div>
          <div>
            <p className="mb-2 text-xl font-semibold text-foreground">
              Ready for Insights
            </p>
            <p className="max-w-md text-foreground">
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
    <div className="rounded-xl border border-border/50 bg-surface/70 p-6 shadow-modal backdrop-blur-sm">
      <h2 className="mb-6 text-lg font-semibold text-foreground">
        Nutrition Insights
      </h2>

      {/* Top metrics grid - key performance indicators */}
      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-1 md:grid-cols-3">
        {/* Consistency Score */}
        <MetricCard
          title="Consistency Score"
          value={consistencyScore}
          subtitle="out of 100"
          score={consistencyScore}
          {...METRIC_CARD_CONFIGS.consistency}
          delay={0}
          textColor="text-foreground"
        >
          <div className="flex h-full flex-col">
            <div className="mb-2 flex items-center justify-between text-xs text-primary/70">
              <span className="text-foreground">Logging frequency</span>
              <span className="text-foreground">Intake variation</span>
            </div>
            <div
              className={BAR_BASE_CLASSES}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={consistencyScore}
              aria-label="Consistency score"
            >
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${getColorByScore(consistencyScore, "consistency")}`}
                style={{ width: `${consistencyScore}%` }}
              />
            </div>
          </div>
        </MetricCard>
        {/* Macro Balance */}
        <MetricCard
          title="Macro Balance"
          value={macroBalance.score}
          subtitle="P/C/F Balance"
          score={macroBalance.score}
          {...METRIC_CARD_CONFIGS.macroBalance}
          delay={0.1}
          textColor="text-foreground"
        >
          <div className="flex h-full flex-col justify-between">
            <div className="mb-2 flex justify-between text-xs text-purple-300/80">
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
                    <div className="mt-1 flex justify-between text-[10px]">
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
          {...METRIC_CARD_CONFIGS.macroDensity}
          delay={0.2}
          textColor="text-foreground"
        >
          <div className="flex h-full flex-col">
            <div className="mb-2 flex items-center justify-between text-xs text-emerald-300/70">
              <span className="text-foreground">Protein quality</span>
              <span className="text-foreground">Macro balance</span>
            </div>
            <div
              className={BAR_BASE_CLASSES}
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={macroDensity.score}
              aria-label="Nutrient density score"
            >
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${getColorByScore(macroDensity.score, "density")}`}
                style={{ width: `${macroDensity.score}%` }}
              />
            </div>
          </div>
        </MetricCard>
      </div>

      {/* At a Glance Section */}
      <AtAGlanceSection averages={averages} />

      {/* Detailed insights section */}
      <div className="space-y-4">
        {/* Trend Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: STAGGER.sectionTrend }}
          className={SECTION_STYLES.trendAnalysis}
          aria-label="Trend analysis"
        >
          <h3 className="text-md mb-2 font-medium text-primary">
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
          transition={{ duration: 0.3, delay: STAGGER.sectionTracking }}
          className={SECTION_STYLES.trackingAnalysis}
          aria-label="Tracking analysis"
        >
          <h3 className="text-md mb-2 font-medium text-primary">
            Tracking Analysis
          </h3>
          <div className="flex flex-col justify-between sm:flex-row sm:items-center">
            <div className="mb-2 sm:mb-0">
              <span className="text-foreground">
                <AnimatedNumber
                  value={dataQuality.completionRate}
                  toFixedValue={0}
                  suffix="% tracking completion rate"
                  duration={0.6}
                />
              </span>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-surface sm:w-40">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{ width: `${dataQuality.completionRate}%` }}
                />
              </div>
            </div>
            <div className="flex items-center text-foreground">
              <svg
                className="mr-1 h-5 w-5 text-primary"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>
                <AnimatedNumber
                  value={dataQuality.daysLogged}
                  toFixedValue={0}
                  duration={0.5}
                />
                /
                <AnimatedNumber
                  value={dataQuality.totalDaysInPeriod}
                  toFixedValue={0}
                  duration={0.5}
                />
                {" days logged"}
              </span>
            </div>
          </div>
          <p className="mt-2 text-sm text-foreground">{dataQuality.message}</p>
        </motion.div>

        {/* Recommendations */}
        <RecommendationsSection insights={insights} averages={averages} />
      </div>
    </div>
  );
}

export default UnifiedInsights;
