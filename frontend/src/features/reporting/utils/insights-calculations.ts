import type {
  AggregatedDataPoint,
  NutritionAverage,
  MacroTargetPercentages,
  MacroBalanceResult,
  TrendResult,
  DataQualityResult,
  NutrientDensityResult,
} from "../types/insights-types";
import {
  DEFAULT_MACRO_TARGET,
  TREND_THRESHOLD,
} from "../constants/insights-constants";

export function calculateConsistencyScore(data: AggregatedDataPoint[]): number {
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
}

export function calculateMacroBalance(
  averages: NutritionAverage,
  macroTarget?: MacroTargetPercentages | null
): MacroBalanceResult {
  const total = averages.protein + averages.carbs + averages.fats;
  const target = macroTarget || DEFAULT_MACRO_TARGET;

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
    const proteinTolerance = Math.max(5, idealProtein * 0.2);
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
}

export function calculateTrend(
  data: AggregatedDataPoint[],
  metric: keyof AggregatedDataPoint
): TrendResult {
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
    percentChange > TREND_THRESHOLD.up
      ? "up"
      : percentChange < TREND_THRESHOLD.down
      ? "down"
      : "stable";

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
}

export function calculateDataQuality(
  data: AggregatedDataPoint[]
): DataQualityResult {
  if (!data?.length) {
    return {
      daysLogged: 0,
      totalDaysInPeriod: 0,
      completionRate: 0,
      message:
        "Ready to start your nutrition journey? Begin logging your meals to track your progress!",
    };
  }

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
}

export function calculateNutrientDensity(
  averages: NutritionAverage
): NutrientDensityResult {
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
}

export function getScoreColor(score: number): string {
  return score > 70
    ? "bg-green-400"
    : score > 40
    ? "bg-yellow-400"
    : "bg-red-400";
}
