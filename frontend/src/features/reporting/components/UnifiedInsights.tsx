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

interface MacroTargetPercentages {
  proteinPercentage: number;
  carbsPercentage: number;
  fatsPercentage: number;
}

interface UnifiedInsightsProps {
  aggregatedData: AggregatedDataPoint[];
  averages: NutritionAverage;
  isLoading: boolean;
  showNoDataMessage?: boolean;
  macroTarget?: MacroTargetPercentages | null;
}

// Component helper
const getScoreColor = (score: number) =>
  score > 70 ? "bg-green-400" : score > 40 ? "bg-yellow-400" : "bg-red-400";

const TrendIcon = ({ direction }: { direction: string }) => {
  const isUp = direction === "up";
  const color =
    direction === "stable"
      ? "text-gray-400"
      : direction === "insufficient"
      ? "text-gray-500"
      : isUp
      ? "text-red-400"
      : "text-green-400";

  if (direction === "stable" || direction === "insufficient") return null;

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

const calculateMacroBalance = (
  averages: NutritionAverage,
  macroTarget?: MacroTargetPercentages | null
) => {
  const total = averages.protein + averages.carbs + averages.fats;

  // Use default targets if no user target is provided
  const defaultTarget = {
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatsPercentage: 30,
  };
  const target = macroTarget || defaultTarget;

  const idealRatioString = `${target.proteinPercentage}/${target.carbsPercentage}/${target.fatsPercentage}`;
  if (!averages || total === 0) {
    return {
      score: 0,
      idealRatio: idealRatioString,
      currentRatio: "0/0/0",
      recommendations:
        "Start logging your meals to get personalized macro balance insights!",
    };
  }

  const [proteinPct, carbsPct, fatsPct] = [
    Math.round((averages.protein / total) * 100),
    Math.round((averages.carbs / total) * 100),
    Math.round((averages.fats / total) * 100),
  ];

  const [idealProtein, idealCarbs, idealFats] = [
    target.proteinPercentage,
    target.carbsPercentage,
    target.fatsPercentage,
  ];
  const totalDiff =
    Math.abs(proteinPct - idealProtein) +
    Math.abs(carbsPct - idealCarbs) +
    Math.abs(fatsPct - idealFats);

  const score = Math.max(0, 100 - totalDiff * 1.5);
  let recommendations = "Excellent! Your macro balance is right on target.";
  if (totalDiff > 10) {
    const suggestions = [];
    const proteinTolerance = Math.max(5, idealProtein * 0.2); // 20% tolerance or minimum 5%
    const carbsTolerance = Math.max(5, idealCarbs * 0.2);
    const fatsTolerance = Math.max(5, idealFats * 0.2);

    if (proteinPct < idealProtein - proteinTolerance)
      suggestions.push("try adding more protein-rich foods");
    if (proteinPct > idealProtein + proteinTolerance)
      suggestions.push("consider balancing protein with other macros");
    if (carbsPct < idealCarbs - carbsTolerance)
      suggestions.push(
        "include more healthy carbs like fruits and whole grains"
      );
    if (carbsPct > idealCarbs + carbsTolerance)
      suggestions.push("balance carbs with more protein and healthy fats");
    if (fatsPct < idealFats - fatsTolerance)
      suggestions.push("add healthy fats like nuts, avocado, or olive oil");
    if (fatsPct > idealFats + fatsTolerance)
      suggestions.push("balance fats with lean proteins and complex carbs");

    recommendations =
      suggestions.length > 0
        ? `To optimize your macro balance, ${suggestions.join(", and ")}.`
        : "You're close to your target! Small adjustments will help you reach optimal balance.";
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
      direction: "insufficient" as const,
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
      direction: "insufficient" as const,
      percentage: 0,
      message: "Not enough data points to calculate trends.",
    };
  }

  const firstAvg =
    firstDays.reduce((sum, val) => sum + val, 0) / firstDays.length;
  const lastAvg = lastDays.reduce((sum, val) => sum + val, 0) / lastDays.length;

  if (firstAvg === 0) {
    return {
      direction: "insufficient" as const,
      percentage: 0,
      message: "Unable to calculate percentage change from zero baseline.",
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
      daysLogged: 0,
      totalDaysInPeriod: 0,
      completionRate: 0,
      message:
        "Ready to start your nutrition journey? Begin logging your meals to track your progress!",
    };
  }

  // Count days with actual logged data in the selected period
  const daysWithData = data.filter((d) => d.calories > 0).length;
  const totalDaysInPeriod = data.length;
  const completionRate = Math.round((daysWithData / totalDaysInPeriod) * 100);

  const message =
    completionRate >= 90
      ? "Outstanding consistency! You're building excellent tracking habits."
      : completionRate >= 70
      ? "Great job keeping up with your nutrition tracking!"
      : completionRate >= 50
      ? "You're on the right track! Try logging more consistently for better insights."
      : "Every entry counts! More consistent tracking will unlock powerful insights about your nutrition patterns.";

  return {
    daysLogged: daysWithData,
    totalDaysInPeriod,
    completionRate,
    message,
  };
};

const calculateNutrientDensity = (averages: NutritionAverage) => {
  if (!averages?.calories) {
    return {
      score: 0,
      message:
        "Start tracking your meals to discover your nutrition quality score!",
    };
  }

  const proteinDensity = (averages.protein * 4) / averages.calories;
  const score = Math.min(100, Math.round(proteinDensity * 100 * 3));

  const message =
    score >= 80
      ? "Fantastic! Your diet has excellent protein quality and nutrient density."
      : score >= 60
      ? "Great work! You're maintaining good nutritional quality in your meals."
      : score >= 40
      ? "Consider adding more protein-rich foods to boost your nutrition quality."
      : "Focus on nutrient-dense foods like lean proteins, vegetables, and whole grains for better nutrition quality.";

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
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className={`rounded-lg ${bgGradient} p-4 ${borderColor} min-h-[120px] flex flex-col`}
  >
    <div className="flex items-center justify-between mb-2">
      <h3 className={`text-sm font-medium ${textColor}`}>{title}</h3>
      <div className={`h-2 w-2 rounded-full ${getScoreColor(score)}`} />
    </div>{" "}
    <div className="flex items-center justify-between mb-2">
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
            : trend.direction === "insufficient"
            ? "Insufficient data"
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
      </h2>
      {/* Top metrics grid - key performance indicators */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
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
            </div>
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
              })}{" "}
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
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-300/70">
              <span>Protein quality</span>
              <span>Macro balance</span>
            </div>
            {/* Progress bar showing nutrient density score */}
            <div className="w-full bg-gray-800 rounded-full h-1.5">
              <div
                className={`h-1.5 rounded-full transition-all duration-1000 ${
                  nutrientDensity.score > 70
                    ? "bg-emerald-400"
                    : nutrientDensity.score > 40
                    ? "bg-yellow-400"
                    : "bg-red-400"
                }`}
                style={{ width: `${nutrientDensity.score}%` }}
              />
            </div>{" "}
          </div>
        </MetricCard>
      </div>

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
              <span className="text-gray-400 text-xs mt-1">{item.label}</span>{" "}
            </div>
          ))}
        </div>
      </motion.div>

      {/* Detailed insights section */}
      <div className="space-y-4">
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
              </svg>{" "}
              <span>
                {dataQuality.daysLogged}/{dataQuality.totalDaysInPeriod} days
                logged
              </span>
            </div>
          </div>{" "}
          <p className="text-gray-400 text-sm mt-2">{dataQuality.message}</p>
        </motion.div>

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
            />{" "}
            {averages.protein < 100 && (
              <ActionCard
                title="Protein Goals"
                bgColor="bg-green-900/50"
                message={
                  averages.protein === 0
                    ? "Ready to optimize your protein intake? Start tracking to get personalized muscle recovery recommendations!"
                    : averages.protein >= 120
                    ? "Excellent protein intake! You're supporting optimal muscle recovery and growth."
                    : "Great start! Consider boosting your protein to about 1.6g per kg of body weight for optimal muscle support."
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
            )}{" "}
            <ActionCard
              title="Next Steps"
              bgColor="bg-blue-900/50"
              message={
                dataQuality.completionRate < 70
                  ? "Keep building that tracking habit! More consistent logging will unlock deeper insights into your nutrition patterns."
                  : "You're doing great with consistency! Continue tracking and fine-tune your macro balance for optimal results."
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
