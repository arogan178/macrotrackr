import { useMemo } from "react";
import { motion } from "motion/react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import CardContainer from "@/components/form/CardContainer";
import {
  CalorieIcon,
  DropletIcon,
  DrumstickIcon,
  LightningIcon,
  LoadingSpinner,
  TargetIcon,
  TrendingUpIcon,
  WheatIcon,
  XCircleIcon,
} from "@/components/ui";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { RadialProgress } from "@/components/ui/RadialProgress";

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
      <CardContainer className="flex min-h-[300px] items-center justify-center p-6 text-foreground">
        <LoadingSpinner />
      </CardContainer>
    );
  }

  // Handle no data state
  if (!insights || aggregatedData.length === 0 || showNoDataMessage) {
    return (
      <CardContainer className="flex min-h-[300px] items-center justify-center p-6 text-center">
        <div className="space-y-3">
          <div className="text-4xl">Insights</div>
          <div>
            <p className="mb-2 text-xl font-semibold text-foreground">
              Ready for Insights
            </p>
            <p className="max-w-md text-muted">
              Start logging your meals to unlock personalised nutrition
              insights, trends, and recommendations tailored just for you.
            </p>
          </div>
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
    macroDensity,
  } = insights;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center space-x-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <LightningIcon className="h-4 w-4" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-foreground/90">
          Insights
        </h2>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        {/* Top metrics grid - key performance indicators */}
        <div className="col-span-1 grid grid-cols-1 gap-6 md:col-span-3 lg:grid-cols-4">
          {/* Consistency Score */}
          <div className="lg:col-span-1">
            <MetricCard
              title="Consistency Score"
              tooltipText="Measures how consistently you track meals and hit your targets over time."
              score={consistencyScore}
              delay={0}
              variant="custom"
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
                  trackColorClass="text-surface border border-border/10 rounded-full"
                >
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      <AnimatedNumber
                        value={consistencyScore}
                        toFixedValue={0}
                        duration={0.8}
                      />
                    </span>
                    <span className="text-[10px] font-medium tracking-wider text-muted uppercase">
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
              title="Macro Balance"
              tooltipText="Shows how close your current intake of Protein, Carbs, and Fats aligns with your set targets."
              score={macroBalance.score}
              delay={0.1}
              variant="custom"
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
                    const labels = ["Pro", "Carb", "Fat"];
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
                          trackColorClass="text-surface border border-border/10 rounded-full"
                        >
                          <span className="text-xl font-bold text-foreground">
                            {pct}%
                          </span>
                        </RadialProgress>
                        <span className="mt-2 text-xs font-medium tracking-wider text-muted uppercase">
                          {labels[index]}
                        </span>
                        <span className="text-[10px] text-muted/60">
                          {targetParts[index]}% trg
                        </span>
                      </div>
                    ));
                  })()}
                </div>
              </div>
            </MetricCard>
          </div>

          {/* Nutrient Density */}
          <div className="lg:col-span-1">
            <MetricCard
              title="Nutrient Density"
              tooltipText="Evaluates the quality of your macros based on your intake of essential nutrients."
              score={macroDensity.score}
              delay={0.2}
              variant="custom"
            >
              <div className="flex h-full flex-col items-center justify-center pt-4 pb-2">
                <RadialProgress
                  progress={macroDensity.score}
                  size={100}
                  strokeWidth={8}
                  colorClass={getTextColorByScore(
                    macroDensity.score,
                    "density",
                  )}
                  trackColorClass="text-surface border border-border/10 rounded-full"
                >
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold tracking-tight text-foreground">
                      <AnimatedNumber
                        value={macroDensity.score}
                        toFixedValue={0}
                        duration={0.8}
                      />
                    </span>
                    <span className="text-[10px] font-medium tracking-wider text-muted uppercase">
                      quality
                    </span>
                  </div>
                </RadialProgress>
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
              className="flex h-full flex-col p-5"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-semibold tracking-tight text-foreground/90 uppercase">
                    Tracking Analysis
                  </h3>
                  <InfoTooltip text="Evaluates how regularly and completely you log your meals over the selected period." />
                </div>
                {/* Days Tracked Badge */}
                <div className="flex items-center gap-1.5 rounded-md bg-surface-2/80 px-2.5 py-1 text-xs font-medium text-foreground">
                  <span className="font-bold text-foreground">
                    <AnimatedNumber
                      value={
                        typeof dataQuality.daysLogged === "number"
                          ? dataQuality.daysLogged
                          : 0
                      }
                      toFixedValue={0}
                      duration={0.5}
                    />
                  </span>
                  <span className="text-muted/50">/</span>
                  <span className="text-muted">
                    <AnimatedNumber
                      value={
                        typeof dataQuality.totalDaysInPeriod === "number"
                          ? dataQuality.totalDaysInPeriod
                          : 0
                      }
                      toFixedValue={0}
                      duration={0.5}
                    />
                  </span>
                  <span className="text-muted">tracked</span>
                </div>
              </div>

              {/* Stats Grid 2x2 */}
              <div className="grid flex-1 grid-cols-2 gap-3">
                {/* Current Streak */}
                <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-surface-2/50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/10">
                    <CalorieIcon className="h-4 w-4 text-orange-500" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    <AnimatedNumber
                      value={dataQuality.currentStreak}
                      toFixedValue={0}
                      duration={0.5}
                    />
                  </p>
                  <p className="text-[10px] font-medium tracking-wider text-muted uppercase">
                    Current Streak
                  </p>
                </div>

                {/* Best Streak */}
                <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-surface-2/50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-success/10">
                    <TrendingUpIcon className="h-4 w-4 text-success" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    <AnimatedNumber
                      value={dataQuality.longestStreak}
                      toFixedValue={0}
                      duration={0.5}
                    />
                  </p>
                  <p className="text-[10px] font-medium tracking-wider text-muted uppercase">
                    Best Streak
                  </p>
                </div>

                {/* Missed Days */}
                <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-surface-2/50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-error/10">
                    <XCircleIcon className="h-4 w-4 text-error" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    <AnimatedNumber
                      value={dataQuality.missedDays}
                      toFixedValue={0}
                      duration={0.5}
                    />
                  </p>
                  <p className="text-[10px] font-medium tracking-wider text-muted uppercase">
                    Missed Days
                  </p>
                </div>

                {/* Completion Rate */}
                <div className="flex flex-col items-center justify-center gap-1 rounded-lg bg-surface-2/50 p-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                    <TargetIcon className="h-4 w-4 text-primary" />
                  </div>
                  <p className="text-2xl font-bold text-foreground">
                    <AnimatedNumber
                      value={
                        typeof dataQuality.completionRate === "number"
                          ? dataQuality.completionRate
                          : 0
                      }
                      toFixedValue={0}
                      duration={0.6}
                    />
                    <span className="text-lg text-muted/60">%</span>
                  </p>
                  <p className="text-[10px] font-medium tracking-wider text-muted uppercase">
                    Complete
                  </p>
                </div>
              </div>

              {/* Message Banner */}
              <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
                <p className="text-xs leading-relaxed font-medium text-primary/90">
                  {dataQuality.message}
                </p>
              </div>
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
              className="flex h-full flex-col p-5"
            >
              <div className="mb-4 flex items-center gap-2">
                <h3 className="text-sm font-semibold tracking-tight text-foreground/90 uppercase">
                  Trend Analysis
                </h3>
                <InfoTooltip text="Compares average intake in the initial part of the selected range against recent days to show trajectory." />
              </div>

              {/* 2x2 Grid of Trend Cards */}
              <div className="grid flex-1 grid-cols-2 gap-3">
                <TrendDisplay
                  label="Calories"
                  trend={caloriesTrend}
                  data={aggregatedData}
                  dataKey="calories"
                  icon={<CalorieIcon className="h-4 w-4 text-orange-500" />}
                  iconBgColor="bg-orange-500/10"
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
              <div className="mt-4 rounded-md border border-primary/20 bg-primary/5 px-3 py-2">
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
