import type {
  AggregatedDataPoint,
  NutritionAverage,
  MacroTargetSettings,
  MacroBalanceResult,
  TrendResult,
  DataQualityResult,
  NutrientDensityResult,
} from "../types/insights-types";
import {
  DEFAULT_MACRO_TARGET,
  TREND_THRESHOLD,
} from "../constants/insights-constants";

// --- Magic Number Constants ---
const CONSISTENCY_FREQUENCY_WEIGHT = 40;
const CONSISTENCY_SCORE_WEIGHT = 60;
const CONSISTENCY_CV_MAX = 0.5;
const MACRO_BALANCE_DIFF_MULTIPLIER = 1.5;
const MACRO_BALANCE_TOLERANCE_MIN = 5;
const MACRO_BALANCE_TOLERANCE_FACTOR = 0.2;
const TREND_DAYS_REQUIRED = 5;
const TREND_AVG_DAYS = 3;
const DATA_QUALITY_OUTSTANDING = 90;
const DATA_QUALITY_GREAT = 70;
const DATA_QUALITY_GOOD = 50;
const NUTRIENT_DENSITY_SCORE_MAX = 100;
const NUTRIENT_DENSITY_SCORE_FACTOR = 3;
const NUTRIENT_DENSITY_SCORE_PROTEIN_MULT = 100;
const SCORE_COLOR_GREEN = 70;
const SCORE_COLOR_YELLOW = 40;
import { calculateStandardDeviation } from "./macro-calculations";

export function calculateConsistencyScore(data: AggregatedDataPoint[]): number {
  if (!data?.length) return 0;

  const frequencyScore =
    Math.min(data.length / 14, 1) * CONSISTENCY_FREQUENCY_WEIGHT;
  if (data.length <= 1) return frequencyScore;

  const calories = data.map((d) => d.calories).filter(Boolean);
  if (calories.length <= 1) return frequencyScore;

  const avg = calories.reduce((sum, val) => sum + val, 0) / calories.length;
  const standardDev = calculateStandardDeviation(calories);
  const coefficientOfVariation = standardDev / avg;
  const consistencyScore = Math.max(
    0,
    CONSISTENCY_SCORE_WEIGHT *
      (1 -
        Math.min(coefficientOfVariation, CONSISTENCY_CV_MAX) /
          CONSISTENCY_CV_MAX),
  );

  return Math.round(frequencyScore + consistencyScore);
}

export function calculateMacroBalance(
  averages: NutritionAverage,
  macroTarget?: MacroTargetSettings | null,
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

  const score = Math.max(0, 100 - totalDiff * MACRO_BALANCE_DIFF_MULTIPLIER);

  let recommendations = "Excellent! Your macro balance is right on target.";
  if (totalDiff > 10) {
    const suggestions = [];
    const proteinTolerance = Math.max(
      MACRO_BALANCE_TOLERANCE_MIN,
      idealProtein * MACRO_BALANCE_TOLERANCE_FACTOR,
    );
    const carbsTolerance = Math.max(
      MACRO_BALANCE_TOLERANCE_MIN,
      idealCarbs * MACRO_BALANCE_TOLERANCE_FACTOR,
    );
    const fatsTolerance = Math.max(
      MACRO_BALANCE_TOLERANCE_MIN,
      idealFats * MACRO_BALANCE_TOLERANCE_FACTOR,
    );

    if (proteinPct < idealProtein - proteinTolerance)
      suggestions.push("try adding more protein-rich foods");
    if (proteinPct > idealProtein + proteinTolerance)
      suggestions.push("consider balancing protein with other macros");
    if (carbsPct < idealCarbs - carbsTolerance)
      suggestions.push(
        "include more healthy carbs like fruits and whole grains",
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
  metric: keyof AggregatedDataPoint,
): TrendResult {
  if (!data?.length || data.length < TREND_DAYS_REQUIRED) {
    return {
      direction: "insufficient" as const,
      percentage: 0,
      message: `Need at least ${TREND_DAYS_REQUIRED} days of data to analyze trends.`,
    };
  }

  const firstDays = data
    .slice(0, TREND_AVG_DAYS)
    .map((d) => Number(d[metric]))
    .filter(Boolean);
  const lastDays = data
    .slice(-TREND_AVG_DAYS)
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
  data: AggregatedDataPoint[],
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
    completionRate >= DATA_QUALITY_OUTSTANDING
      ? "Outstanding consistency! You're building excellent tracking habits."
      : completionRate >= DATA_QUALITY_GREAT
        ? "Great job keeping up with your nutrition tracking!"
        : completionRate >= DATA_QUALITY_GOOD
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
  averages: NutritionAverage,
): NutrientDensityResult {
  if (!averages?.calories) {
    return {
      score: 0,
      message:
        "Start tracking your meals to discover your nutrition quality score!",
    };
  }

  const proteinDensity = (averages.protein * 4) / averages.calories;
  const score = Math.min(
    NUTRIENT_DENSITY_SCORE_MAX,
    Math.round(
      proteinDensity *
        NUTRIENT_DENSITY_SCORE_PROTEIN_MULT *
        NUTRIENT_DENSITY_SCORE_FACTOR,
    ),
  );

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
  return score > SCORE_COLOR_GREEN
    ? "bg-green-400"
    : score > SCORE_COLOR_YELLOW
      ? "bg-yellow-400"
      : "bg-red-400";
}
