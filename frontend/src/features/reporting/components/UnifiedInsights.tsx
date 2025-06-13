import { useMemo } from "react";
import { motion } from "motion/react";
import LoadingSpinner from "@/components/LoadingSpinner";

// Types
interface AggregatedDataPoint {
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface NutritionAverage {
  calories: number;
  protein: number;
  carbs: number;
  fats: number;
}

interface UnifiedInsightsProps {
  aggregatedData: AggregatedDataPoint[];
  averages: NutritionAverage;
  isLoading: boolean;
  showNoDataMessage?: boolean;
}

// Component helper
const getScoreColor = (score: number) =>
  score > 70 ? "bg-green-400" : score > 40 ? "bg-yellow-400" : "bg-red-400";

const getStrokeColor = (score: number) =>
  score > 70 ? "#10B981" : score > 40 ? "#FBBF24" : "#F87171";

const TrendIcon = ({ direction }: { direction: string }) => {
  const isUp = direction === "up";
  const color =
    direction === "stable"
      ? "text-gray-400"
      : isUp
      ? "text-red-400"
      : "text-green-400";

  if (direction === "stable") return null;

  return (
    <svg
      className={`h-4 w-4 ${color} mr-1`}
      viewBox="0 0 20 20"
      fill="currentColor"
    >
      <path
        fillRule="evenodd"
        d={
          isUp
            ? "M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
            : "M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
        }
        clipRule="evenodd"
      />
    </svg>
  );
};

// Helper functions
const calculateConsistencyScore = (data: AggregatedDataPoint[]): number => {
  if (!data?.length) return 0;

  const frequencyScore = Math.min(data.length / 14, 1) * 40;
  if (data.length <= 1) return frequencyScore;

  const calories = data.map((d) => d.calories).filter(Boolean);
  if (calories.length <= 1) return frequencyScore;

  const avg = calories.reduce((sum, val) => sum + val, 0) / calories.length;
  const variance =
    calories.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
    calories.length;
  const coefficientOfVariation = Math.sqrt(variance) / avg;
  const consistencyScore = Math.max(
    0,
    60 * (1 - Math.min(coefficientOfVariation, 0.5) / 0.5)
  );

  return Math.round(frequencyScore + consistencyScore);
};

const calculateMacroBalance = (averages: NutritionAverage) => {
  const total = averages.protein + averages.carbs + averages.fats;

  if (!averages || total === 0) {
    return {
      score: 0,
      idealRatio: "30/40/30",
      currentRatio: "0/0/0",
      recommendations: "Start tracking your nutrition to see recommendations.",
    };
  }

  const [proteinPct, carbsPct, fatsPct] = [
    Math.round((averages.protein / total) * 100),
    Math.round((averages.carbs / total) * 100),
    Math.round((averages.fats / total) * 100),
  ];

  const [idealProtein, idealCarbs, idealFats] = [30, 40, 30];
  const totalDiff =
    Math.abs(proteinPct - idealProtein) +
    Math.abs(carbsPct - idealCarbs) +
    Math.abs(fatsPct - idealFats);

  const score = Math.max(0, 100 - totalDiff * 1.5);

  let recommendations = "Your macro balance is optimal.";
  if (totalDiff > 10) {
    const suggestions = [];
    if (proteinPct < 25) suggestions.push("Increase protein intake");
    if (proteinPct > 35) suggestions.push("Consider reducing protein slightly");
    if (carbsPct < 35) suggestions.push("Increase carbohydrate intake");
    if (carbsPct > 45) suggestions.push("Reduce carbohydrate intake");
    if (fatsPct < 25) suggestions.push("Include more healthy fats");
    if (fatsPct > 35) suggestions.push("Reduce fat intake");

    recommendations = suggestions.join(". ") + ".";
  }

  return {
    score: Math.round(score),
    idealRatio: `${idealProtein}/${idealCarbs}/${idealFats}`,
    currentRatio: `${proteinPct}/${carbsPct}/${fatsPct}`,
    recommendations,
  };
};

const calculateTrend = (
  data: AggregatedDataPoint[],
  metric: keyof AggregatedDataPoint
) => {
  if (!data?.length || data.length < 5) {
    return {
      direction: "stable" as const,
      percentage: 0,
      message: "Need at least 5 days of data to analyze trends.",
    };
  }

  const firstDays = data
    .slice(0, 3)
    .map((d) => Number(d[metric]))
    .filter(Boolean);
  const lastDays = data
    .slice(-3)
    .map((d) => Number(d[metric]))
    .filter(Boolean);

  if (!firstDays.length || !lastDays.length) {
    return {
      direction: "stable" as const,
      percentage: 0,
      message: "Insufficient data to calculate trends.",
    };
  }

  const firstAvg =
    firstDays.reduce((sum, val) => sum + val, 0) / firstDays.length;
  const lastAvg = lastDays.reduce((sum, val) => sum + val, 0) / lastDays.length;

  if (firstAvg === 0) {
    return {
      direction: "stable" as const,
      percentage: 0,
      message: "Unable to calculate percentage change.",
    };
  }

  const percentChange = ((lastAvg - firstAvg) / firstAvg) * 100;
  const direction =
    percentChange > 3 ? "up" : percentChange < -3 ? "down" : "stable";
  const message =
    direction === "stable"
      ? "Your intake has been stable."
      : `Your ${metric} intake is ${
          direction === "up" ? "trending upward" : "trending downward"
        }.`;

  return {
    direction,
    percentage: Math.abs(Math.round(percentChange)),
    message,
  };
};

const calculateDataQuality = (data: AggregatedDataPoint[]) => {
  if (!data?.length) {
    return {
      streak: 0,
      completionRate: 0,
      message: "Start tracking your nutrition to see insights.",
    };
  }

  const daysWithData = data.filter((d) => d.calories > 0).length;
  const completionRate = Math.round((daysWithData / data.length) * 100);
  const streak = data.length;

  const message =
    completionRate >= 90
      ? "Excellent tracking consistency!"
      : completionRate >= 70
      ? "Good tracking habits. Keep it up!"
      : completionRate >= 50
      ? "Try to log your nutrition more consistently."
      : "Regular tracking will help provide better insights.";

  return { streak, completionRate, message };
};

const calculateNutrientDensity = (averages: NutritionAverage) => {
  if (!averages?.calories) {
    return {
      score: 0,
      message: "Start tracking to see nutrient density score.",
    };
  }

  const proteinDensity = (averages.protein * 4) / averages.calories;
  const score = Math.min(100, Math.round(proteinDensity * 100 * 3));

  const message =
    score >= 80
      ? "Excellent nutrient density with high protein quality."
      : score >= 60
      ? "Good nutrient profile with adequate protein."
      : score >= 40
      ? "Consider including more protein-rich foods."
      : "Focus on more nutrient-dense food choices.";

  return { score, message };
};

// Sub-components
const MetricCard = ({
  title,
  value,
  subtitle,
  score,
  bgGradient,
  borderColor,
  textColor,
  delay = 0,
  children,
  variant = "default",
}: {
  title: string;
  value: string | number;
  subtitle: string;
  score: number;
  bgGradient: string;
  borderColor: string;
  textColor: string;
  delay?: number;
  children?: React.ReactNode;
  variant?: "default" | "compact";
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className={`rounded-lg ${bgGradient} p-4 ${borderColor} ${
      variant === "compact" ? "min-h-[140px]" : "min-h-[120px]"
    } flex flex-col`}
  >
    <div className="flex items-center justify-between mb-2">
      <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>
      <div className={`h-2 w-2 rounded-full ${getScoreColor(score)}`} />
    </div>
    <div className="flex items-end justify-between mb-2">
      <span className="text-2xl font-bold text-white">{value}</span>
      <span className={`text-xs ${textColor}/70`}>{subtitle}</span>
    </div>
    <div className="flex-1 flex flex-col justify-end">{children}</div>
  </motion.div>
);

const TrendDisplay = ({
  label,
  trend,
}: {
  label: string;
  trend: ReturnType<typeof calculateTrend>;
}) => (
  <div>
    <div className="flex items-center mb-1">
      <span className="text-gray-300 font-medium">{label}:</span>
      <span className="ml-2 flex items-center">
        <TrendIcon direction={trend.direction} />
        <span className="text-gray-200">
          {trend.direction === "stable"
            ? "Stable"
            : `${trend.percentage}% ${
                trend.direction === "up" ? "increase" : "decrease"
              }`}
        </span>
      </span>
    </div>
    <p className="text-gray-400 text-sm">{trend.message}</p>
  </div>
);

const ActionCard = ({
  title,
  icon,
  message,
  bgColor,
}: {
  title: string;
  icon: React.ReactNode;
  message: string;
  bgColor: string;
}) => (
  <div className="rounded-lg bg-gray-800/50 p-3 border border-gray-700/50">
    <div className="flex items-center mb-2">
      <div className={`${bgColor} rounded-full p-1.5 mr-2`}>{icon}</div>
      <h4 className="text-sm font-medium text-gray-300">{title}</h4>
    </div>
    <p className="text-gray-300 text-sm">{message}</p>
  </div>
);

function UnifiedInsights({
  aggregatedData,
  averages,
  isLoading,
  showNoDataMessage = false,
}: UnifiedInsightsProps) {
  // Calculate all insights metrics in one pass
  const insights = useMemo(() => {
    if (isLoading || !aggregatedData || aggregatedData.length === 0) {
      return null;
    }
    return {
      consistencyScore: calculateConsistencyScore(aggregatedData),
      macroBalance: calculateMacroBalance(averages),
      caloriesTrend: calculateTrend(aggregatedData, "calories"),
      proteinTrend: calculateTrend(aggregatedData, "protein"),
      dataQuality: calculateDataQuality(aggregatedData),
      nutrientDensity: calculateNutrientDensity(averages),
    };
  }, [aggregatedData, averages, isLoading]);

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
        <div>
          <p className="mb-2 text-xl font-semibold">Nutrition Insights</p>
          <p>Log more nutrition data to unlock detailed insights</p>
        </div>
      </div>
    );
  }
  // Daily averages data helper
  const dailyAveragesData = [
    {
      label: "Calories",
      value: Math.round(averages.calories),
      unit: "cal",
      color: "text-white",
    },
    {
      label: "Protein",
      value: Math.round(averages.protein),
      unit: "g",
      color: "text-green-300",
    },
    {
      label: "Carbs",
      value: Math.round(averages.carbs),
      unit: "g",
      color: "text-blue-300",
    },
    {
      label: "Fats",
      value: Math.round(averages.fats),
      unit: "g",
      color: "text-red-300",
    },
  ];

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
      </h2>{" "}
      {/* Top metrics grid - key performance indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {" "}
        {/* Consistency Score */}
        <MetricCard
          title="Consistency Score"
          value={consistencyScore}
          subtitle="out of 100"
          score={consistencyScore}
          bgGradient="bg-gradient-to-br from-indigo-900/60 to-indigo-800/30"
          borderColor="border border-indigo-700/30"
          textColor="text-indigo-300"
          delay={0}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-indigo-300/70">
              <span>Logging frequency</span>
              <span>Intake variation</span>
            </div>
            {/* Progress bar showing score */}
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-1000 ${
                  consistencyScore > 70
                    ? "bg-green-400"
                    : consistencyScore > 40
                    ? "bg-yellow-400"
                    : "bg-red-400"
                }`}
                style={{ width: `${consistencyScore}%` }}
              />
            </div>{" "}
          </div>
        </MetricCard>
        {/* Macro Balance */}
        <MetricCard
          title="Macro Balance"
          value={macroBalance.score}
          subtitle="P/C/F Balance"
          score={macroBalance.score}
          bgGradient="bg-gradient-to-br from-purple-900/60 to-purple-800/30"
          borderColor="border border-purple-700/30"
          textColor="text-purple-300"
          delay={0.1}
        >
          <div className="space-y-1">
            {/* Current ratio display */}
            <div className="flex justify-between text-[11px] text-purple-300/80">
              <span>Current: {macroBalance.currentRatio}</span>
              <span>Target: {macroBalance.idealRatio}</span>
            </div>
            {/* Macro ratio visualization */}
            <div className="flex h-2 rounded-full overflow-hidden bg-gray-800">
              {macroBalance.currentRatio.split("/").map((pct, idx) => {
                const colors = ["bg-green-500", "bg-blue-500", "bg-red-500"];
                return (
                  <div
                    key={idx}
                    className={`${colors[idx]} h-full transition-all duration-1000`}
                    style={{ width: `${pct}%` }}
                  />
                );
              })}
            </div>
            {/* Labels */}
            <div className="flex justify-between text-[10px]">
              {macroBalance.currentRatio.split("/").map((pct, idx) => {
                const labels = ["Protein", "Carbs", "Fats"];
                const colors = [
                  "text-green-300",
                  "text-blue-300",
                  "text-red-300",
                ];
                return (
                  <span key={idx} className={colors[idx]}>
                    {labels[idx]}: {pct}%
                  </span>
                );
              })}
            </div>
          </div>
        </MetricCard>
        {/* Nutrient Density */}
        <MetricCard
          title="Nutrient Density"
          value={nutrientDensity.score}
          subtitle="quality score"
          score={nutrientDensity.score}
          bgGradient="bg-gradient-to-br from-emerald-900/60 to-emerald-800/30"
          borderColor="border border-emerald-700/30"
          textColor="text-emerald-300"
          delay={0.2}
          variant="compact"
        >
          {/* Compact circular progress and description */}
          <div className="flex items-center justify-between">
            <div className="text-xs text-emerald-300/70">
              Based on protein quality
            </div>
            <div className="relative">
              <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                {/* Background circle */}
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke="#444"
                  strokeWidth="3"
                />
                {/* Progress arc */}
                <circle
                  cx="20"
                  cy="20"
                  r="16"
                  fill="none"
                  stroke={getStrokeColor(nutrientDensity.score)}
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeDasharray={`${
                    (nutrientDensity.score / 100) * 100.53
                  } 100.53`}
                  className="transition-all duration-1000"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[10px] font-semibold text-white">
                  {nutrientDensity.score}%
                </span>
              </div>
            </div>
          </div>
        </MetricCard>
      </div>{" "}
      {/* At a Glance - Quick daily averages */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.25 }}
        className="p-4 rounded-lg border border-purple-500/20 bg-purple-900/10 mb-6"
      >
        <h3 className="text-md font-medium text-purple-300 mb-3">
          At a Glance
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {dailyAveragesData.map((item, index) => (
            <div key={index} className="flex flex-col">
              <span className="text-gray-400 text-xs">Daily Average</span>
              <span className={`text-xl font-bold ${item.color}`}>
                {item.value}
                {item.unit}
              </span>
              <span className="text-gray-400 text-xs mt-1">{item.label}</span>
            </div>
          ))}
        </div>
      </motion.div>
      {/* Detailed insights section */}
      <div className="space-y-4">
        {" "}
        {/* Trend Analysis */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="p-4 rounded-lg border border-blue-500/20 bg-blue-900/10"
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
          className="p-4 rounded-lg border border-indigo-500/20 bg-indigo-900/10"
        >
          <h3 className="text-md font-medium text-indigo-300 mb-2">
            Tracking Analysis
          </h3>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between">
            <div className="mb-2 sm:mb-0">
              <span className="text-gray-300">
                {dataQuality.completionRate}% tracking completion rate
              </span>
              <div className="mt-1 h-1.5 w-full sm:w-40 bg-gray-700 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full"
                  style={{ width: `${dataQuality.completionRate}%` }}
                ></div>
              </div>
            </div>
            <div className="text-gray-300 flex items-center">
              <svg
                className="h-5 w-5 text-indigo-400 mr-1"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
              <span>
                {dataQuality.streak} day{dataQuality.streak !== 1 ? "s" : ""}{" "}
                logged
              </span>
            </div>
          </div>
          <p className="text-gray-400 text-sm mt-2">{dataQuality.message}</p>
        </motion.div>{" "}
        {/* Recommendations */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="p-4 rounded-lg border border-green-500/20 bg-green-900/10"
        >
          <div className="flex items-center mb-3">
            <svg
              className="h-5 w-5 text-green-400 mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            <h3 className="text-md font-medium text-green-300">
              Personalized Action Plan
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <ActionCard
              title="Macro Balance"
              bgColor="bg-purple-900/50"
              message={macroBalance.recommendations}
              icon={
                <svg
                  className="h-4 w-4 text-purple-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                  />
                </svg>
              }
            />

            <ActionCard
              title="Food Quality"
              bgColor="bg-emerald-900/50"
              message={nutrientDensity.message}
              icon={
                <svg
                  className="h-4 w-4 text-emerald-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                  />
                </svg>
              }
            />

            {averages.protein < 100 && (
              <ActionCard
                title="Protein Intake"
                bgColor="bg-green-900/50"
                message={
                  averages.protein === 0
                    ? "Start tracking your protein intake for muscle recovery recommendations."
                    : averages.protein >= 120
                    ? "Your protein intake is excellent for muscle recovery and growth."
                    : "Consider increasing your protein intake to at least 1.6g per kg of bodyweight."
                }
                icon={
                  <svg
                    className="h-4 w-4 text-green-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                    />
                  </svg>
                }
              />
            )}

            <ActionCard
              title="Next Steps"
              bgColor="bg-blue-900/50"
              message={
                dataQuality.completionRate < 70
                  ? "Focus on consistent tracking for more accurate insights."
                  : "Continue your tracking consistency and work on addressing macro balance."
              }
              icon={
                <svg
                  className="h-4 w-4 text-blue-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                  />
                </svg>
              }
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default UnifiedInsights;
