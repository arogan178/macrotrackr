import { useMemo } from "react";
import { motion } from "motion/react";
import LoadingSpinner from "@/components/LoadingSpinner";

interface EnhancedInsightsProps {
  aggregatedData: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }[];
  averages: { calories: number; protein: number; carbs: number; fats: number };
  isLoading: boolean;
}

// Helper functions for calculating insights
function calculateConsistencyScore(data: Array<any>): number {
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

function calculateMacroBalance(averages: EnhancedInsightsProps["averages"]): {
  score: number;
  idealRatio: string;
  currentRatio: string;
} {
  if (!averages || !averages.protein || !averages.carbs || !averages.fats) {
    return { score: 0, idealRatio: "40/30/30", currentRatio: "0/0/0" };
  }

  const total = averages.protein + averages.carbs + averages.fats;

  if (total === 0) {
    return { score: 0, idealRatio: "40/30/30", currentRatio: "0/0/0" };
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
  const proteinDiff = Math.abs(proteinPct - idealProtein);
  const carbsDiff = Math.abs(carbsPct - idealCarbs);
  const fatsDiff = Math.abs(fatsPct - idealFats);

  // Total deviation from ideal (lower is better)
  const totalDiff = proteinDiff + carbsDiff + fatsDiff;

  // Score based on how close to ideal (100 = perfect match)
  const score = Math.max(0, 100 - totalDiff * 1.5);

  return {
    score: Math.round(score),
    idealRatio: `${idealProtein}/${idealCarbs}/${idealFats}`,
    currentRatio: `${proteinPct}/${carbsPct}/${fatsPct}`,
  };
}

function calculateTrend(
  data: Array<any>,
  metric: string
): {
  direction: "up" | "down" | "stable";
  percentage: number;
} {
  if (!data || data.length < 5) {
    return { direction: "stable", percentage: 0 };
  }

  // Get values for the first and last 3 days
  const firstDays = data
    .slice(0, 3)
    .map((d) => d[metric])
    .filter(Boolean);
  const lastDays = data
    .slice(-3)
    .map((d) => d[metric])
    .filter(Boolean);

  if (firstDays.length === 0 || lastDays.length === 0) {
    return { direction: "stable", percentage: 0 };
  }

  // Calculate averages for both periods
  const firstAvg =
    firstDays.reduce((sum, val) => sum + val, 0) / firstDays.length;
  const lastAvg = lastDays.reduce((sum, val) => sum + val, 0) / lastDays.length;

  if (firstAvg === 0) return { direction: "stable", percentage: 0 };

  // Calculate percentage change
  const percentChange = ((lastAvg - firstAvg) / firstAvg) * 100;

  // Determine direction
  const direction =
    percentChange > 3 ? "up" : percentChange < -3 ? "down" : "stable";

  return {
    direction,
    percentage: Math.abs(Math.round(percentChange)),
  };
}

function calculateStreak(data: Array<any>): number {
  if (!data || data.length === 0) return 0;

  // Simple count of days in dataset
  return data.length;
}

function EnhancedInsights({
  aggregatedData,
  averages,
  isLoading,
}: EnhancedInsightsProps) {
  const insights = useMemo(() => {
    if (isLoading || !aggregatedData || aggregatedData.length === 0) {
      return null;
    }

    return {
      consistencyScore: calculateConsistencyScore(aggregatedData),
      macroBalance: calculateMacroBalance(averages),
      caloriesTrend: calculateTrend(aggregatedData, "calories"),
      streak: calculateStreak(aggregatedData),
    };
  }, [aggregatedData, averages, isLoading]);

  if (isLoading) {
    return (
      <div className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-6 h-60 flex items-center justify-center text-gray-400 shadow-xl">
        <LoadingSpinner />
      </div>
    );
  }

  if (!insights || aggregatedData.length === 0) {
    return (
      <div className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-6 h-60 flex items-center justify-center text-gray-400 text-center shadow-xl">
        <div>
          <p className="mb-2 text-xl font-semibold">Enhanced Insights</p>
          <p>Log more nutrition data to unlock insights</p>
        </div>
      </div>
    );
  }

  const { consistencyScore, macroBalance, caloriesTrend, streak } = insights;

  return (
    <div className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-6 shadow-xl">
      <h2 className="text-lg font-semibold text-gray-200 mb-4">
        Enhanced Insights
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            Based on logging frequency and variation
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
          <div className="mt-2 text-xs text-purple-300/70">
            Current: {macroBalance.currentRatio} (Ideal:{" "}
            {macroBalance.idealRatio})
          </div>
        </motion.div>

        {/* Calorie Trend */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          className="rounded-lg bg-gradient-to-br from-blue-900/60 to-blue-800/30 p-4 border border-blue-700/30"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-blue-300">Calorie Trend</h3>
            <div
              className={`h-2 w-2 rounded-full ${
                caloriesTrend.direction === "stable"
                  ? "bg-green-400"
                  : "bg-yellow-400"
              }`}
            />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-white flex items-center">
              {caloriesTrend.direction === "up" && (
                <svg
                  className="h-5 w-5 text-red-400 mr-1"
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
                  className="h-5 w-5 text-green-400 mr-1"
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
              {caloriesTrend.direction === "stable"
                ? "Stable"
                : `${caloriesTrend.percentage}%`}
            </span>
            <span className="text-xs text-blue-300/70">
              {caloriesTrend.direction !== "stable"
                ? `${
                    caloriesTrend.direction === "up" ? "Increase" : "Decrease"
                  }`
                : "Consistent"}
            </span>
          </div>
          <div className="mt-2 text-xs text-blue-300/70">
            Based on your recent tracking history
          </div>
        </motion.div>

        {/* Tracking Streak */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="rounded-lg bg-gradient-to-br from-emerald-900/60 to-emerald-800/30 p-4 border border-emerald-700/30"
        >
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-medium text-emerald-300">
              Logging Days
            </h3>
            <div
              className={`h-2 w-2 rounded-full ${
                streak > 7
                  ? "bg-green-400"
                  : streak > 3
                  ? "bg-yellow-400"
                  : "bg-red-400"
              }`}
            />
          </div>
          <div className="flex items-end justify-between">
            <span className="text-2xl font-bold text-white">{streak}</span>
            <span className="text-xs text-emerald-300/70">days tracked</span>
          </div>
          <div className="mt-2 text-xs text-emerald-300/70">
            {streak > 7
              ? "Great consistency!"
              : streak > 3
              ? "Building momentum"
              : "Keep tracking!"}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default EnhancedInsights;
