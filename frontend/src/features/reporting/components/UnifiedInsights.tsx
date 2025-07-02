import { useMemo } from "react";
import { motion } from "motion/react";
import LoadingSpinner from "@/components/LoadingSpinner";
import type { UnifiedInsightsProps } from "../types/insights-types";
import {
  calculateConsistencyScore,
  calculateMacroBalance,
  calculateTrend,
  calculateDataQuality,
  calculateNutrientDensity,
} from "../utils/insights-calculations";
import {
  METRIC_CARD_CONFIGS,
  MACRO_COLORS,
  SECTION_STYLES,
} from "../constants";
import MetricCard from "./MetricCard";
import AtAGlanceSection from "./AtAGlanceSection";
import TrendDisplay from "./TrendDisplay";
import RecommendationsSection from "./RecommendationsSection";
import AnimatedNumber from "@/components/animation/AnimatedNumber";

function UnifiedInsights({
  aggregatedData,
  averages,
  isLoading,
  showNoDataMessage = false,
  macroTarget,
}: UnifiedInsightsProps) {
  // Calculate all insights metrics in one pass
  const insights = useMemo(() => {
    if (isLoading || !aggregatedData || aggregatedData.length === 0) {
      return null;
    }
    return {
      consistencyScore: calculateConsistencyScore(aggregatedData),
      macroBalance: calculateMacroBalance(averages, macroTarget),
      caloriesTrend: calculateTrend(aggregatedData, "calories"),
      proteinTrend: calculateTrend(aggregatedData, "protein"),
      dataQuality: calculateDataQuality(aggregatedData),
      nutrientDensity: calculateNutrientDensity(averages),
    };
  }, [aggregatedData, averages, isLoading, macroTarget]);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 flex items-center justify-center text-gray-400 shadow-xl min-h-[250px]">
        <LoadingSpinner />
      </div>
    );
  }

  // Handle no data state
  if (!insights || aggregatedData.length === 0 || showNoDataMessage) {
    return (
      <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 flex items-center justify-center text-gray-400 text-center shadow-xl min-h-[250px]">
        <div className="space-y-3">
          <div className="text-4xl">📊</div>
          <div>
            <p className="mb-2 text-xl font-semibold text-gray-200">
              Ready for Insights!
            </p>
            <p className="text-gray-400 max-w-md">
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
    nutrientDensity,
  } = insights;

  return (
    <div className="bg-gray-800/70 backdrop-blur-sm rounded-xl border border-gray-700/50 p-6 shadow-xl">
      <h2 className="text-lg font-semibold text-gray-200 mb-6">
        Comprehensive Nutrition Insights
      </h2>

      {/* Top metrics grid - key performance indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {" "}
        {/* Consistency Score */}
        <MetricCard
          title="Consistency Score"
          value={consistencyScore}
          subtitle="out of 100"
          score={consistencyScore}
          {...METRIC_CARD_CONFIGS.consistency}
          delay={0}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between text-xs text-indigo-300/70 mb-2">
              <span>Logging frequency</span>
              <span>Intake variation</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  consistencyScore > 70
                    ? "bg-green-400"
                    : consistencyScore > 40
                    ? "bg-yellow-400"
                    : "bg-red-400"
                }`}
                style={{ width: `${consistencyScore}%` }}
              />
            </div>
          </div>
        </MetricCard>{" "}
        {/* Macro Balance */}
        <MetricCard
          title="Macro Balance"
          value={macroBalance.score}
          subtitle="P/C/F Balance"
          score={macroBalance.score}
          {...METRIC_CARD_CONFIGS.macroBalance}
          delay={0.1}
        >
          <div className="flex flex-col justify-between h-full">
            <div className="flex justify-between text-xs text-purple-300/80 mb-2">
              <span>Current: {macroBalance.currentRatio}</span>
              <span>Target: {macroBalance.idealRatio}</span>
            </div>
            <div>
              <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
                {macroBalance.currentRatio.split("/").map((pct, idx) => {
                  const colors = [
                    MACRO_COLORS.protein.bar,
                    MACRO_COLORS.carbs.bar,
                    MACRO_COLORS.fats.bar,
                  ];
                  return (
                    <div
                      key={idx}
                      className={`${colors[idx]} h-full transition-all duration-1000`}
                      style={{ width: `${pct}%` }}
                    />
                  );
                })}
              </div>
              <div className="flex justify-between text-[10px] mt-1">
                {macroBalance.currentRatio.split("/").map((pct, idx) => {
                  const labels = ["Protein", "Carbs", "Fats"];
                  const colors = [
                    MACRO_COLORS.protein.text,
                    MACRO_COLORS.carbs.text,
                    MACRO_COLORS.fats.text,
                  ];
                  return (
                    <span key={idx} className={colors[idx]}>
                      {labels[idx]}: {pct}%
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </MetricCard>{" "}
        {/* Nutrient Density */}
        <MetricCard
          title="Nutrient Density"
          value={nutrientDensity.score}
          subtitle="quality score"
          score={nutrientDensity.score}
          {...METRIC_CARD_CONFIGS.nutrientDensity}
          delay={0.2}
        >
          <div className="flex flex-col h-full">
            <div className="flex items-center justify-between text-xs text-emerald-300/70 mb-2">
              <span>Protein quality</span>
              <span>Macro balance</span>
            </div>
            <div className="w-full bg-gray-800 rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all duration-1000 ${
                  nutrientDensity.score > 70
                    ? "bg-emerald-400"
                    : nutrientDensity.score > 40
                    ? "bg-yellow-400"
                    : "bg-red-400"
                }`}
                style={{ width: `${nutrientDensity.score}%` }}
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
          transition={{ duration: 0.3, delay: 0.3 }}
          className={SECTION_STYLES.trendAnalysis}
        >
          <h3 className="text-md font-medium text-blue-300 mb-2">
            Trend Analysis
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <TrendDisplay label="Calories" trend={caloriesTrend} />
            <TrendDisplay label="Protein" trend={proteinTrend} />
          </div>
        </motion.div>

        {/* Tracking Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className={SECTION_STYLES.trackingAnalysis}
        >
          <h3 className="text-md font-medium text-indigo-300 mb-2">
            Tracking Analysis
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            {" "}
            <div className="mb-2 sm:mb-0">
              <span className="text-gray-300">
                <AnimatedNumber
                  value={dataQuality.completionRate}
                  toFixedValue={0}
                  suffix="% tracking completion rate"
                  duration={0.6}
                />
              </span>
              <div className="mt-1 h-1.5 w-full sm:w-40 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${dataQuality.completionRate}%` }}
                />
              </div>
            </div>
            <div className="text-gray-300 flex items-center">
              <svg
                className="h-5 w-5 text-indigo-400 mr-1"
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
              </svg>{" "}
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
          <p className="text-gray-400 text-sm mt-2">{dataQuality.message}</p>
        </motion.div>

        {/* Recommendations */}
        <RecommendationsSection insights={insights} averages={averages} />
      </div>
    </div>
  );
}

export default UnifiedInsights;
