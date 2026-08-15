import type { MacroTargetSettings } from "@/types/macro";

import {
  DEFAULT_MACRO_TARGET,
  TREND_THRESHOLD,
} from "../constants/insightsConstants";
import type {
  AggregatedDataPoint,
  DataQualityResult,
  MacroBalanceResult,
  MacroDensityResult,
  NutritionAverage,
  TrendResult,
} from "../types/insightsTypes";

function calculateStandardDeviation(values: number[]): number {
  if (values.length === 0) return 0;
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  const variance =
    values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) /
    values.length;

  return Math.sqrt(variance);
}

// --- Magic Number Constants ---
const CONSISTENCY_FREQUENCY_WEIGHT = 40;
const CONSISTENCY_SCORE_WEIGHT = 60;
const CONSISTENCY_CV_MAX = 0.5;
const MACRO_BALANCE_DIFF_MULTIPLIER = 1.5;
const MACRO_BALANCE_TOLERANCE_MIN = 5;
const MACRO_BALANCE_TOLERANCE_FACTOR = 0.2;
const TREND_DAYS_REQUIRED = 5;
const TREND_AVG_DAYS = 3;
const SCORE_COLOR_GREEN = 70;
const SCORE_COLOR_YELLOW = 40;

export function calculateConsistencyScore(
  data: AggregatedDataPoint[],
  denominatorDays?: number,
): number {
  if (!data.length) return 0;

  // Frequency: proportion of days with data over the selected window
  const daysWithData = data.filter((d) => d.calories > 0).length;
  const denominator =
    typeof denominatorDays === "number" && denominatorDays > 0
      ? denominatorDays
      : data.length;
  const frequencyScore =
    Math.min(daysWithData / Math.max(denominator, 1), 1) *
    CONSISTENCY_FREQUENCY_WEIGHT;
  if (data.length <= 1) return Math.round(frequencyScore);

  // Variation: lower variation (CV) yields higher score
  const calories = data.map((d) => d.calories).filter((v) => v > 0);
  if (calories.length <= 1) return Math.round(frequencyScore);

  const avg = calories.reduce((sum, value) => sum + value, 0) / calories.length;
  const standardDevelopment = calculateStandardDeviation(calories);
  const coefficientOfVariation = standardDevelopment / avg;
  const variationScore = Math.max(
    0,
    CONSISTENCY_SCORE_WEIGHT *
      (1 -
        Math.min(coefficientOfVariation, CONSISTENCY_CV_MAX) /
          CONSISTENCY_CV_MAX),
  );

  return Math.round(frequencyScore + variationScore);
}

export function calculateMacroBalance(
  averages: NutritionAverage,
  macroTarget?: MacroTargetSettings | undefined,
): MacroBalanceResult {
  const proteinCals = averages.protein * 4;
  const carbsCals = averages.carbs * 4;
  const fatsCals = averages.fats * 9;
  const totalCals = proteinCals + carbsCals + fatsCals;
  const target = macroTarget ?? DEFAULT_MACRO_TARGET;

  const idealRatioString = `${target.proteinPercentage}/${target.carbsPercentage}/${target.fatsPercentage}`;

  if (totalCals === 0) {
    return {
      score: 0,
      idealRatio: idealRatioString,
      currentRatio: "0/0/0",
      recommendations: "No meals logged in this period.",
    };
  }

  const [proteinPct, carbsPct, fatsPct] = [
    Math.round((proteinCals / totalCals) * 100),
    Math.round((carbsCals / totalCals) * 100),
    Math.round((fatsCals / totalCals) * 100),
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

  // Name the gaps in points rather than prescribing foods: the app knows the
  // split, not what is on the plate.
  const gaps: string[] = [];
  if (totalDiff > 10) {
    const tolerance = (ideal: number) =>
      Math.max(MACRO_BALANCE_TOLERANCE_MIN, ideal * MACRO_BALANCE_TOLERANCE_FACTOR);

    for (const [name, actual, ideal] of [
      ["Protein", proteinPct, idealProtein],
      ["Carbs", carbsPct, idealCarbs],
      ["Fats", fatsPct, idealFats],
    ] as const) {
      const difference = actual - ideal;
      if (Math.abs(difference) > tolerance(ideal)) {
        gaps.push(
          `${name} is ${Math.abs(difference)} points ${
            difference > 0 ? "above" : "below"
          } your ${ideal}% target`,
        );
      }
    }
  }

  const recommendations =
    gaps.length > 0
      ? `${gaps.join(". ")}.`
      : `Your split is within ${Math.round(totalDiff)} points of your target.`;

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
  const unit = metric === "calories" ? "kcal" : "g";

  if (!data.length || data.length < TREND_DAYS_REQUIRED) {
    return {
      direction: "insufficient" as const,
      percentage: 0,
      message: `Need at least ${TREND_DAYS_REQUIRED} days of data to analyse trends.`,
      unit,
    };
  }

  const firstDays = data
    .slice(0, TREND_AVG_DAYS)
    .map((d) => Number(d[metric]))
    .filter((v) => !isNaN(v) && v > 0);
  const lastDays = data
    .slice(-TREND_AVG_DAYS)
    .map((d) => Number(d[metric]))
    .filter((v) => !isNaN(v) && v > 0);

  if (firstDays.length === 0 || lastDays.length === 0) {
    return {
      direction: "insufficient" as const,
      percentage: 0,
      message: "Not enough data points to calculate trends.",
      unit,
    };
  }

  const firstAvg =
    firstDays.reduce((sum, value) => sum + value, 0) / firstDays.length;
  const lastAvg =
    lastDays.reduce((sum, value) => sum + value, 0) / lastDays.length;

  if (firstAvg === 0) {
    return {
      direction: "insufficient" as const,
      percentage: 0,
      message: "Unable to calculate percentage change from zero baseline.",
      unit,
    };
  }

  const rawDelta = lastAvg - firstAvg;
  const percentChange = (rawDelta / firstAvg) * 100;
  const direction =
    percentChange > TREND_THRESHOLD.up
      ? "up"
      : percentChange < TREND_THRESHOLD.down
        ? "down"
        : "stable";

  const roundedFirstAvg = Math.round(firstAvg);
  const roundedLastAvg = Math.round(lastAvg);
  const roundedDelta = Math.round(rawDelta);

  const metricLabel = metric.charAt(0).toUpperCase() + metric.slice(1);
  const message =
    direction === "stable"
      ? `${metricLabel} intake has been stable (${roundedLastAvg} ${unit}/day).`
      : `${metricLabel} intake is ${
          direction === "up" ? "trending upward" : "trending downward"
        } (${roundedDelta > 0 ? "+" : ""}${roundedDelta} ${unit}/day).`;

  return {
    direction,
    percentage: Math.abs(Math.round(percentChange)),
    message,
    firstAvg: roundedFirstAvg,
    lastAvg: roundedLastAvg,
    delta: roundedDelta,
    unit,
  };
}

export function generateOverallTrendSummary(
  caloriesTrend: TrendResult,
  proteinTrend: TrendResult,
  carbsTrend: TrendResult,
  fatsTrend: TrendResult,
): string {
  if (
    caloriesTrend.direction === "insufficient" ||
    proteinTrend.direction === "insufficient"
  ) {
    return `Need at least ${TREND_DAYS_REQUIRED} logged days in this period to show a trend.`;
  }

  if (
    caloriesTrend.direction === "stable" &&
    proteinTrend.direction === "stable" &&
    carbsTrend.direction === "stable" &&
    fatsTrend.direction === "stable"
  ) {
    return "Your daily calories and macro intake have stayed consistent across this period.";
  }

  const calText =
    caloriesTrend.direction === "stable"
      ? "Calories remain steady"
      : `Calories are trending ${caloriesTrend.direction === "up" ? "upward" : "downward"} (${
          caloriesTrend.delta && caloriesTrend.delta > 0 ? "+" : ""
        }${caloriesTrend.delta} kcal/day)`;

  const macroDrivers: string[] = [];
  if (proteinTrend.direction !== "stable") {
    macroDrivers.push(
      `protein ${proteinTrend.direction === "up" ? "+" : ""}${proteinTrend.delta}g/day`,
    );
  }
  if (carbsTrend.direction !== "stable") {
    macroDrivers.push(
      `carbs ${carbsTrend.direction === "up" ? "+" : ""}${carbsTrend.delta}g/day`,
    );
  }
  if (fatsTrend.direction !== "stable") {
    macroDrivers.push(
      `fats ${fatsTrend.direction === "up" ? "+" : ""}${fatsTrend.delta}g/day`,
    );
  }

  if (macroDrivers.length > 0) {
    return `${calText}, influenced by changes in ${macroDrivers.join(", ")}.`;
  }

  return `${calText} while macronutrient distribution remains relatively stable.`;
}

function calculateStreaks(data: AggregatedDataPoint[]): {
  currentStreak: number;
  longestStreak: number;
} {
  if (!data.length) return { currentStreak: 0, longestStreak: 0 };

  // Create array of booleans indicating if day has data (calories > 0)
  const hasDataArray = data.map((d) => d.calories > 0);

  // Calculate current streak (consecutive days from the end).
  // If the last day (today) has no logs yet, but yesterday was logged,
  // treat yesterday as the active streak anchor since today is in progress.
  let currentStreak = 0;
  const lastIndex = hasDataArray.length - 1;

  if (hasDataArray[lastIndex]) {
    for (let index = lastIndex; index >= 0; index--) {
      if (hasDataArray[index]) {
        currentStreak++;
      } else {
        break;
      }
    }
  } else if (lastIndex > 0 && hasDataArray[lastIndex - 1]) {
    for (let index = lastIndex - 1; index >= 0; index--) {
      if (hasDataArray[index]) {
        currentStreak++;
      } else {
        break;
      }
    }
  }

  // Calculate longest streak
  let longestStreak = 0;
  let currentRun = 0;
  for (const hasData of hasDataArray) {
    if (hasData) {
      currentRun++;
      longestStreak = Math.max(longestStreak, currentRun);
    } else {
      currentRun = 0;
    }
  }

  return { currentStreak, longestStreak };
}

export function calculateDataQuality(
  data: AggregatedDataPoint[],
  totalDaysOverride?: number,
): DataQualityResult {
  // If no data at all, still respect a provided override for denominator
  if (!data.length) {
    const totalDaysInPeriod = totalDaysOverride ?? 0;

    return {
      daysLogged: 0,
      totalDaysInPeriod,
      completionRate: 0,
      message: "No meals logged in this period.",
      currentStreak: 0,
      longestStreak: 0,
      missedDays: totalDaysInPeriod,
    };
  }

  const daysWithData = data.filter((d) => d.calories > 0).length;

  // Prefer explicit denominator if provided (e.g., 7/30/90 or custom inclusive range)
  const totalDaysInPeriod =
    typeof totalDaysOverride === "number" && totalDaysOverride > 0
      ? totalDaysOverride
      : data.length;

  const completionRate =
    totalDaysInPeriod > 0
      ? Math.round((daysWithData / totalDaysInPeriod) * 100)
      : 0;

  const { currentStreak, longestStreak } = calculateStreaks(data);

  const missedDays = totalDaysInPeriod - daysWithData;
  const message =
    missedDays > 0
      ? `Logged ${daysWithData} of ${totalDaysInPeriod} days. ${missedDays} ${
          missedDays === 1 ? "day" : "days"
        } missed.`
      : `Logged every day in this period (${daysWithData} of ${totalDaysInPeriod}).`;

  return {
    daysLogged: daysWithData,
    totalDaysInPeriod,
    completionRate,
    message,
    currentStreak,
    longestStreak,
    missedDays,
  };
}

/**
 * Share of average daily calories coming from protein.
 *
 * This used to be dressed up as a 0-100 "nutrition quality score", but it only
 * ever measured protein ratio scaled by two arbitrary constants. It now reports
 * the ratio itself, which is the only thing the data supports.
 */
export function calculateMacroDensity(
  averages: NutritionAverage,
): MacroDensityResult {
  if (!averages.calories) {
    return { score: 0, message: "No meals logged in this period." };
  }

  const score = Math.round((averages.protein * 4 * 100) / averages.calories);

  return {
    score,
    message: `${score}% of your calories came from protein (${Math.round(
      averages.protein,
    )} g/day).`,
  };
}

export function getScoreColor(score: number): string {
  return score > SCORE_COLOR_GREEN
    ? "bg-success"
    : score > SCORE_COLOR_YELLOW
      ? "bg-warning"
      : "bg-error";
}
