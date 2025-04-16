import React from "react";
import { WeightLogEntry } from "@/features/goals/types";
import { CardContainer } from "@/components/form";
import { TrendingUpIcon, TrendingDownIcon } from "@/components/Icons";
import {
  subMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
  isValid,
  differenceInCalendarMonths,
} from "date-fns";

interface MonthlyTrendCardProps {
  weightLog: WeightLogEntry[];
  isLoading: boolean;
}

// Helper to calculate monthly trend
function calculateMonthlyTrend(log: WeightLogEntry[]): number | null {
  if (log.length < 2) return null;

  const now = new Date();
  // Consider the last 3 full months + current partial month
  const threeMonthsAgo = subMonths(now, 3);

  const recentLogs = log
    .map((entry) => ({ ...entry, date: parseISO(entry.timestamp) }))
    .filter(
      (entry) =>
        isValid(entry.date) && entry.date >= startOfMonth(threeMonthsAgo)
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (recentLogs.length < 2) return null;

  // Group logs by month number (relative to the start of the period)
  const firstMonthStart = startOfMonth(recentLogs[0].date);
  const monthlyData: Record<number, { weights: number[]; count: number }> = {};

  recentLogs.forEach((entry) => {
    const monthNumber = differenceInCalendarMonths(
      startOfMonth(entry.date),
      firstMonthStart
    );
    if (!monthlyData[monthNumber]) {
      monthlyData[monthNumber] = { weights: [], count: 0 };
    }
    monthlyData[monthNumber].weights.push(entry.weight);
    monthlyData[monthNumber].count++;
  });

  const monthlyAverages = Object.entries(monthlyData)
    .map(([monthNum, data]) => ({
      month: parseInt(monthNum, 10),
      avgWeight: data.weights.reduce((sum, w) => sum + w, 0) / data.count,
    }))
    .sort((a, b) => a.month - b.month);

  if (monthlyAverages.length < 2) return null;

  // Calculate trend between the first and last month with data in the period
  const firstMonthAvg = monthlyAverages[0].avgWeight;
  const lastMonthAvg = monthlyAverages[monthlyAverages.length - 1].avgWeight;
  const monthDifference =
    monthlyAverages[monthlyAverages.length - 1].month -
    monthlyAverages[0].month;

  // Avoid division by zero if data is only within the same month index
  if (monthDifference === 0) return null;

  // Return the total change over the period considered
  return lastMonthAvg - firstMonthAvg;
}

function MonthlyTrendCard({ weightLog, isLoading }: MonthlyTrendCardProps) {
  const monthlyChange = React.useMemo(
    () => calculateMonthlyTrend(weightLog),
    [weightLog]
  );

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-xs text-gray-400">Calculating...</p>;
    }
    if (monthlyChange === null) {
      return (
        <p className="text-xs text-gray-400">
          Not enough data for monthly trend.
        </p>
      );
    }

    const absChange = Math.abs(monthlyChange).toFixed(1);
    const isLoss = monthlyChange < 0;
    const isGain = monthlyChange > 0;

    return (
      <div className="flex items-center">
        {isLoss && (
          <TrendingDownIcon className="w-5 h-5 text-indigo-400 mr-2" />
        )}
        {isGain && <TrendingUpIcon className="w-5 h-5 text-green-400 mr-2" />}
        <span
          className={`text-lg font-semibold ${
            isLoss
              ? "text-indigo-300"
              : isGain
              ? "text-green-300"
              : "text-gray-300"
          }`}
        >
          {isLoss ? `-${absChange}` : isGain ? `+${absChange}` : "0.0"} kg
        </span>
        <span className="text-xs text-gray-400 ml-1.5">in last ~3 months</span>
      </div>
    );
  };

  return (
    <CardContainer>
      <h3 className="text-sm font-medium text-gray-300 mb-2">Monthly Trend</h3>
      {renderContent()}
    </CardContainer>
  );
}

export default MonthlyTrendCard;
