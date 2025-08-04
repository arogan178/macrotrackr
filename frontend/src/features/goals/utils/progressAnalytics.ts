import {
  differenceInCalendarMonths,
  differenceInWeeks,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
  subWeeks,
} from "date-fns";
import type { WeightLogEntry } from "@/utils/apiServices";

/**
 * Calculate weekly average change over last ~4 weeks.
 * Logic copied from WeeklyAverageCard to preserve results exactly.
 */
export function calculateWeeklyAverageChange(
  log: WeightLogEntry[],
): number | undefined {
  if (log.length < 2) return undefined;

  const now = new Date();
  const fourWeeksAgo = subWeeks(now, 4);

  const recentLogs = log
    .map((entry) => ({ ...entry, date: parseISO(entry.timestamp) }))
    .filter((entry) => isValid(entry.date) && entry.date >= startOfWeek(fourWeeksAgo))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (recentLogs.length < 2) return undefined;

  const firstWeekStart = startOfWeek(recentLogs[0].date);
  const weeklyData: Record<number, { weights: number[]; count: number }> = {};

  for (const entry of recentLogs) {
    const weekNumber = differenceInWeeks(startOfWeek(entry.date), firstWeekStart);
    if (!weeklyData[weekNumber]) {
      weeklyData[weekNumber] = { weights: [], count: 0 };
    }
    weeklyData[weekNumber].weights.push(entry.weight);
    weeklyData[weekNumber].count++;
  }

  const weeklyAverages = Object.entries(weeklyData)
    .map(([weekNumber, data]) => ({
      week: Number.parseInt(weekNumber, 10),
      avgWeight: data.weights.reduce((sum, w) => sum + w, 0) / data.count,
    }))
    .sort((a, b) => a.week - b.week);

  if (weeklyAverages.length < 2) return undefined;

  let totalChange = 0;
  let changeCount = 0;
  for (let i = 1; i < weeklyAverages.length; i++) {
    if (weeklyAverages[i].week === weeklyAverages[i - 1].week + 1) {
      totalChange += weeklyAverages[i].avgWeight - weeklyAverages[i - 1].avgWeight;
      changeCount++;
    }
  }

  return changeCount > 0 ? totalChange / changeCount : undefined;
}

/**
 * Calculate monthly trend over last ~3 months.
 * Logic copied from MonthlyTrendCard to preserve results exactly.
 */
export function calculateMonthlyTrend(log: WeightLogEntry[]): number | undefined {
  if (log.length < 2) return undefined;

  const now = new Date();
  const threeMonthsAgo = subMonths(now, 3);

  const recentLogs = log
    .map((entry) => ({ ...entry, date: parseISO(entry.timestamp) }))
    .filter((entry) => isValid(entry.date) && entry.date >= startOfMonth(threeMonthsAgo))
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (recentLogs.length < 2) return undefined;

  const firstMonthStart = startOfMonth(recentLogs[0].date);
  const monthlyData: Record<number, { weights: number[]; count: number }> = {};

  for (const entry of recentLogs) {
    const monthNumber = differenceInCalendarMonths(startOfMonth(entry.date), firstMonthStart);
    if (!monthlyData[monthNumber]) {
      monthlyData[monthNumber] = { weights: [], count: 0 };
    }
    monthlyData[monthNumber].weights.push(entry.weight);
    monthlyData[monthNumber].count++;
  }

  const monthlyAverages = Object.entries(monthlyData)
    .map(([monthNumber, data]) => ({
      month: Number.parseInt(monthNumber, 10),
      avgWeight: data.weights.reduce((sum, w) => sum + w, 0) / data.count,
    }))
    .sort((a, b) => a.month - b.month);

  if (monthlyAverages.length < 2) return undefined;

  const firstMonthAvg = monthlyAverages[0].avgWeight;
  const lastMonthAvg = monthlyAverages.at(-1)!.avgWeight;
  const monthDifference = monthlyAverages.at(-1)!.month - monthlyAverages[0].month;

  if (monthDifference === 0) return undefined;

  return lastMonthAvg - firstMonthAvg;
}

/**
 * Get chart Y domain with padding identical to current behavior.
 */
export function getChartDomain(
  weights: number[],
  targetWeight?: number,
): { domainMin: number; domainMax: number } {
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0;
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0;

  const effectiveMin = Math.min(minWeight, targetWeight ?? Infinity);
  const effectiveMax = Math.max(maxWeight, targetWeight ?? 0);

  const padding = Math.max(1, (effectiveMax - effectiveMin) * 0.05);
  const calculatedMin = Math.floor(Math.max(0, effectiveMin - padding));
  const calculatedMax = Math.ceil(effectiveMax + padding);

  if (calculatedMax - calculatedMin < 2) {
    return { domainMin: calculatedMin - 1, domainMax: calculatedMax + 1 };
  }

  return { domainMin: calculatedMin, domainMax: calculatedMax };
}