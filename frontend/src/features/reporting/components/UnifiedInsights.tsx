import { useMemo } from "react";
import { motion } from "motion/react";
import LoadingSpinner from "@/components/LoadingSpinner";

// Define interfaces for component props and data structures
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

/**
 * Helper functions for calculating insights
 */

// Calculate a consistency score based on logging frequency and calorie variance
function calculateConsistencyScore(data: AggregatedDataPoint[]): number {
  if (!data || data.length === 0) return 0;

  // More data points = better consistency score (up to a cap)
  const frequencyScore = Math.min(data.length / 14, 1) * 40;

  // Calculate variance of calorie intake (lower variance = more consistent)
  if (data.length <= 1) return frequencyScore;

  const calories = data.map((d) => d.calories).filter(Boolean);
  if (calories.length <= 1) return frequencyScore;

  const avg = calories.reduce((sum, val) => sum + val, 0) / calories.length;
  const variance =
    calories.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
    calories.length;
  const stdDev = Math.sqrt(variance);
  const coefficientOfVariation = stdDev / avg;

  // Lower coefficient of variation means more consistency
  const consistencyScore = Math.max(
    0,
    60 * (1 - Math.min(coefficientOfVariation, 0.5) / 0.5)
  );

  return Math.round(frequencyScore + consistencyScore);
}

// Calculate macronutrient balance score and ratios
function calculateMacroBalance(averages: NutritionAverage): {
  score: number;
  idealRatio: string;
  currentRatio: string;
  recommendations: string;
} {
  if (!averages || !averages.protein || !averages.carbs || !averages.fats) {
    return {
      score: 0,
      idealRatio: "40/30/30",
      currentRatio: "0/0/0",
      recommendations: "Start tracking your nutrition to see recommendations.",
    };
  }

  const total = averages.protein + averages.carbs + averages.fats;

  if (total === 0) {
    return {
      score: 0,
      idealRatio: "40/30/30",
      currentRatio: "0/0/0",
      recommendations: "Start tracking your nutrition to see recommendations.",
    };
  }

  // Calculate current P/C/F ratio
  const proteinPct = Math.round((averages.protein / total) * 100);
  const carbsPct = Math.round((averages.carbs / total) * 100);
  const fatsPct = Math.round((averages.fats / total) * 100);

  // Simple ideal ratio (can be adjusted based on user goals)
  const idealProtein = 30;
  const idealCarbs = 40;
  const idealFats = 30;

  // Calculate how close the current ratio is to ideal
  const proteinDiff = proteinPct - idealProtein;
  const carbsDiff = carbsPct - idealCarbs;
  const fatsDiff = fatsPct - idealFats;

  // Total deviation from ideal (lower is better)
  const totalDiff =
    Math.abs(proteinDiff) + Math.abs(carbsDiff) + Math.abs(fatsDiff);

  // Score based on how close to ideal (100 = perfect match)
  const score = Math.max(0, 100 - totalDiff * 1.5);
  // Generate recommendations based on differences
  let recommendations = "Your macro balance is optimal.";

  if (totalDiff > 10) {
    const recommendationsList = [];
    if (proteinDiff < -5) recommendationsList.push("Increase protein intake");
    if (proteinDiff > 5)
      recommendationsList.push("Consider reducing protein slightly");
    if (carbsDiff < -5)
      recommendationsList.push("Increase carbohydrate intake");
    if (carbsDiff > 5) recommendationsList.push("Reduce carbohydrate intake");
    if (fatsDiff < -5) recommendationsList.push("Include more healthy fats");
    if (fatsDiff > 5) recommendationsList.push("Reduce fat intake");

    recommendations = recommendationsList.join(". ") + ".";
  }

  return {
    score: Math.round(score),
    idealRatio: `${idealProtein}/${idealCarbs}/${idealFats}`,
    currentRatio: `${proteinPct}/${carbsPct}/${fatsPct}`,
    recommendations,
  };
}

// Calculate trends for a specific metric
function calculateTrend(
  data: AggregatedDataPoint[],
  metric: keyof AggregatedDataPoint
): {
  direction: "up" | "down" | "stable";
  percentage: number;
  message: string;
} {
  if (!data || data.length < 5) {
    return {
      direction: "stable",
      percentage: 0,
      message: "Need at least 5 days of data to analyze trends.",
    };
  }

  // Get values for the first and last 3 days
  const firstDays = data
    .slice(0, 3)
    .map((d) => Number(d[metric]))
    .filter(Boolean);
  const lastDays = data
    .slice(-3)
    .map((d) => Number(d[metric]))
    .filter(Boolean);

  if (firstDays.length === 0 || lastDays.length === 0) {
    return {
      direction: "stable",
      percentage: 0,
      message: "Insufficient data to calculate trends.",
    };
  }

  // Calculate averages for both periods
  const firstAvg =
    firstDays.reduce((sum, val) => sum + val, 0) / firstDays.length;
  const lastAvg = lastDays.reduce((sum, val) => sum + val, 0) / lastDays.length;

  if (firstAvg === 0) {
    return {
      direction: "stable",
      percentage: 0,
      message: "Unable to calculate percentage change.",
    };
  }

  // Calculate percentage change
  const percentChange = ((lastAvg - firstAvg) / firstAvg) * 100;

  // Determine direction and message
  let direction: "up" | "down" | "stable" = "stable";
  let message = "Your intake has been stable.";

  if (percentChange > 3) {
    direction = "up";
    message =
      metric === "calories"
        ? "Your calorie intake is trending upward."
        : `Your ${metric} intake is increasing.`;
  } else if (percentChange < -3) {
    direction = "down";
    message =
      metric === "calories"
        ? "Your calorie intake is trending downward."
        : `Your ${metric} intake is decreasing.`;
  }

  return {
    direction,
    percentage: Math.abs(Math.round(percentChange)),
    message,
  };
}

// Calculate data quality and logging consistency
function calculateDataQuality(data: AggregatedDataPoint[]): {
  streak: number;
  completionRate: number;
  message: string;
} {
  if (!data || data.length === 0) {
    return {
      streak: 0,
      completionRate: 0,
      message: "Start tracking your nutrition to see insights.",
    };
  }

  // Data completion - days with data vs total days
  const daysWithData = data.filter((d) => d.calories > 0).length;
  const completionRate = Math.round((daysWithData / data.length) * 100);

  // Simple count of days in dataset for streak
  const streak = data.length;

  // Generate appropriate message
  let message = "";
  if (completionRate >= 90) {
    message = "Excellent tracking consistency!";
  } else if (completionRate >= 70) {
    message = "Good tracking habits. Keep it up!";
  } else if (completionRate >= 50) {
    message = "Try to log your nutrition more consistently.";
  } else {
    message = "Regular tracking will help provide better insights.";
  }

  return {
    streak,
    completionRate,
    message,
  };
}

// Calculate nutrient density score based on macro ratios
function calculateNutrientDensity(averages: NutritionAverage): {
  score: number;
  message: string;
} {
  if (!averages || averages.calories === 0) {
    return {
      score: 0,
      message: "Start tracking to see nutrient density score.",
    };
  }

  // Simple protein density score (protein per calorie)
  // Higher protein per calorie generally indicates more nutrient-dense foods
  const proteinDensity = (averages.protein * 4) / averages.calories;

  // Convert to a 0-100 score
  // A good protein density is around 25-30% of calories from protein
  const score = Math.min(100, Math.round(proteinDensity * 100 * 3));

  let message = "";
  if (score >= 80) {
    message = "Excellent nutrient density with high protein quality.";
  } else if (score >= 60) {
    message = "Good nutrient profile with adequate protein.";
  } else if (score >= 40) {
    message = "Consider including more protein-rich foods.";
  } else {
    message = "Focus on more nutrient-dense food choices.";
  }

  return { score, message };
}

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
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-lg bg-gradient-to-br from-indigo-900/60 to-indigo-800/30 p-4 border border-indigo-700/30"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-indigo-300">
              Consistency Score
            </h3>
            <div
              className={`h-2 w-2 rounded-full ${
                consistencyScore > 70
                  ? "bg-green-400"
                  : consistencyScore > 40
                  ? "bg-yellow-400"
                  : "bg-red-400"
              }`}
            />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-white">
              {consistencyScore}
            </span>
            <span className="text-xs text-indigo-300/70">out of 100</span>
          </div>
          <div className="mt-2 text-xs text-indigo-300/70">
            Based on logging frequency and intake variation
          </div>
        </motion.div>

        {/* Macro Balance */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-lg bg-gradient-to-br from-purple-900/60 to-purple-800/30 p-4 border border-purple-700/30"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-purple-300">
              Macro Balance
            </h3>
            <div
              className={`h-2 w-2 rounded-full ${
                macroBalance.score > 70
                  ? "bg-green-400"
                  : macroBalance.score > 40
                  ? "bg-yellow-400"
                  : "bg-red-400"
              }`}
            />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-white">
              {macroBalance.score}
            </span>
            <span className="text-xs text-purple-300/70">P/C/F Balance</span>
          </div>

          {/* Add a visual representation of the macro ratio */}
          <div className="flex mt-2 h-1.5 rounded-full overflow-hidden bg-gray-800">
            {/* Protein bar */}
            <div
              className="bg-green-500 h-full"
              style={{
                width: `${macroBalance.currentRatio.split("/")[0]}%`,
                transition: "width 1s ease-out",
              }}
            ></div>
            {/* Carbs bar */}
            <div
              className="bg-blue-500 h-full"
              style={{
                width: `${macroBalance.currentRatio.split("/")[1]}%`,
                transition: "width 1s ease-out",
              }}
            ></div>
            {/* Fats bar */}
            <div
              className="bg-red-500 h-full"
              style={{
                width: `${macroBalance.currentRatio.split("/")[2]}%`,
                transition: "width 1s ease-out",
              }}
            ></div>
          </div>

          <div className="flex justify-between mt-1 text-[10px]">
            <span className="text-green-300">
              P: {macroBalance.currentRatio.split("/")[0]}%
            </span>
            <span className="text-blue-300">
              C: {macroBalance.currentRatio.split("/")[1]}%
            </span>
            <span className="text-red-300">
              F: {macroBalance.currentRatio.split("/")[2]}%
            </span>
          </div>
        </motion.div>

        {/* Nutrient Density */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-lg bg-gradient-to-br from-emerald-900/60 to-emerald-800/30 p-4 border border-emerald-700/30"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-emerald-300">
              Nutrient Density
            </h3>
            <div
              className={`h-2 w-2 rounded-full ${
                nutrientDensity.score > 70
                  ? "bg-green-400"
                  : nutrientDensity.score > 40
                  ? "bg-yellow-400"
                  : "bg-red-400"
              }`}
            />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-white">
              {nutrientDensity.score}
            </span>
            <span className="text-xs text-emerald-300/70">quality score</span>
          </div>

          {/* Add a circular gauge visualization */}
          <div className="mt-2 flex justify-center items-center">
            <div className="relative inline-flex">
              <svg className="w-16 h-16" viewBox="0 0 36 36">
                {/* Background circle */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke="#444"
                  strokeWidth="2"
                  strokeDasharray="100, 100"
                />
                {/* Progress arc */}
                <path
                  d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  fill="none"
                  stroke={
                    nutrientDensity.score > 70
                      ? "#10B981" // emerald-500
                      : nutrientDensity.score > 40
                      ? "#FBBF24" // amber-400
                      : "#F87171" // red-400
                  }
                  strokeWidth="2"
                  strokeDasharray={`${nutrientDensity.score}, 100`}
                  strokeLinecap="round"
                />
                {/* Score text */}
                <text
                  x="18"
                  y="20.5"
                  className="text-xs font-medium"
                  textAnchor="middle"
                  fill="white"
                >
                  {nutrientDensity.score}%
                </text>
              </svg>
            </div>
          </div>

          <div className="mt-2 text-xs text-emerald-300/70 text-center">
            Based on protein quality and macro balance
          </div>
        </motion.div>
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
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs">Daily Average</span>
            <span className="text-xl font-bold text-white">
              {Math.round(averages.calories)} cal
            </span>
            <span className="text-gray-400 text-xs mt-1">Calories</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs">Daily Average</span>
            <span className="text-xl font-bold text-green-300">
              {Math.round(averages.protein)}g
            </span>
            <span className="text-gray-400 text-xs mt-1">Protein</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs">Daily Average</span>
            <span className="text-xl font-bold text-blue-300">
              {Math.round(averages.carbs)}g
            </span>
            <span className="text-gray-400 text-xs mt-1">Carbs</span>
          </div>
          <div className="flex flex-col">
            <span className="text-gray-400 text-xs">Daily Average</span>
            <span className="text-xl font-bold text-red-300">
              {Math.round(averages.fats)}g
            </span>
            <span className="text-gray-400 text-xs mt-1">Fats</span>
          </div>
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
            <div>
              <div className="flex items-center mb-1">
                <span className="text-gray-300 font-medium">Calories:</span>
                <span className="ml-2 flex items-center">
                  {caloriesTrend.direction === "up" && (
                    <svg
                      className="h-4 w-4 text-red-400 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {caloriesTrend.direction === "down" && (
                    <svg
                      className="h-4 w-4 text-green-400 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className="text-gray-200">
                    {caloriesTrend.direction === "stable"
                      ? "Stable"
                      : `${caloriesTrend.percentage}% ${
                          caloriesTrend.direction === "up"
                            ? "increase"
                            : "decrease"
                        }`}
                  </span>
                </span>
              </div>
              <p className="text-gray-400 text-sm">{caloriesTrend.message}</p>
            </div>
            <div>
              <div className="flex items-center mb-1">
                <span className="text-gray-300 font-medium">Protein:</span>
                <span className="ml-2 flex items-center">
                  {proteinTrend.direction === "up" && (
                    <svg
                      className="h-4 w-4 text-green-400 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M5.293 9.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 7.414V15a1 1 0 11-2 0V7.414L6.707 9.707a1 1 0 01-1.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  {proteinTrend.direction === "down" && (
                    <svg
                      className="h-4 w-4 text-red-400 mr-1"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M14.707 10.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 12.586V5a1 1 0 012 0v7.586l2.293-2.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span className="text-gray-200">
                    {proteinTrend.direction === "stable"
                      ? "Stable"
                      : `${proteinTrend.percentage}% ${
                          proteinTrend.direction === "up"
                            ? "increase"
                            : "decrease"
                        }`}
                  </span>
                </span>
              </div>
              <p className="text-gray-400 text-sm">{proteinTrend.message}</p>
            </div>
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
              xmlns="http://www.w3.org/2000/svg"
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
            <div className="rounded-lg bg-gray-800/50 p-3 border border-gray-700/50">
              <div className="flex items-center mb-2">
                <div className="bg-purple-900/50 rounded-full p-1.5 mr-2">
                  <svg
                    className="h-4 w-4 text-purple-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
                    />
                  </svg>
                </div>
                <h4 className="text-sm font-medium text-purple-300">
                  Macro Balance
                </h4>
              </div>
              <p className="text-gray-300 text-sm">
                {macroBalance.recommendations}
              </p>
            </div>

            <div className="rounded-lg bg-gray-800/50 p-3 border border-gray-700/50">
              <div className="flex items-center mb-2">
                <div className="bg-emerald-900/50 rounded-full p-1.5 mr-2">
                  <svg
                    className="h-4 w-4 text-emerald-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 11.5V14m0-2.5v-6a1.5 1.5 0 113 0m-3 6a1.5 1.5 0 00-3 0v2a7.5 7.5 0 0015 0v-5a1.5 1.5 0 00-3 0m-6-3V11m0-5.5v-1a1.5 1.5 0 013 0v1m0 0V11m0-5.5a1.5 1.5 0 013 0v3m0 0V11"
                    />
                  </svg>
                </div>
                <h4 className="text-sm font-medium text-emerald-300">
                  Food Quality
                </h4>
              </div>
              <p className="text-gray-300 text-sm">{nutrientDensity.message}</p>
            </div>

            {averages.protein < 100 && (
              <div className="rounded-lg bg-gray-800/50 p-3 border border-gray-700/50">
                <div className="flex items-center mb-2">
                  <div className="bg-green-900/50 rounded-full p-1.5 mr-2">
                    <svg
                      className="h-4 w-4 text-green-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                      />
                    </svg>
                  </div>
                  <h4 className="text-sm font-medium text-green-300">
                    Protein Intake
                  </h4>
                </div>
                <p className="text-gray-300 text-sm">
                  {averages.protein === 0
                    ? "Start tracking your protein intake for muscle recovery recommendations."
                    : averages.protein >= 120
                    ? "Your protein intake is excellent for muscle recovery and growth."
                    : "Consider increasing your protein intake to at least 1.6g per kg of bodyweight."}
                </p>
              </div>
            )}

            <div className="rounded-lg bg-gray-800/50 p-3 border border-gray-700/50">
              <div className="flex items-center mb-2">
                <div className="bg-blue-900/50 rounded-full p-1.5 mr-2">
                  <svg
                    className="h-4 w-4 text-blue-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
                    />
                  </svg>
                </div>
                <h4 className="text-sm font-medium text-blue-300">
                  Next Steps
                </h4>
              </div>
              <p className="text-gray-300 text-sm">
                {dataQuality.completionRate < 70
                  ? "Focus on consistent tracking for more accurate insights."
                  : "Continue your tracking consistency and work on addressing macro balance."}
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default UnifiedInsights;
