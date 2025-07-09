import React from "react";
import { WeightLogEntry } from "@/utils/api-service";
import { CardContainer } from "@/components/form"; // Assuming CardContainer exists
import { TrendingUpIcon, TrendingDownIcon } from "@/components/ui"; // Assuming these exist
import {
  subWeeks,
  startOfWeek,
  differenceInWeeks,
  parseISO,
  isValid,
} from "date-fns";

interface WeeklyAverageCardProps {
  weightLog: WeightLogEntry[];
  isLoading: boolean;
}

// Helper to calculate weekly average change
function calculateWeeklyAverageChange(log: WeightLogEntry[]): number | null {
  if (log.length < 2) return null;

  const now = new Date();
  const fourWeeksAgo = subWeeks(now, 4);

  // Filter logs for the last 4 full weeks + current partial week
  const recentLogs = log
    .map((entry) => ({ ...entry, date: parseISO(entry.timestamp) }))
    .filter(
      (entry) => isValid(entry.date) && entry.date >= startOfWeek(fourWeeksAgo),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (recentLogs.length < 2) return null;

  // Group logs by week number (relative to the start of the period)
  const firstWeekStart = startOfWeek(recentLogs[0].date);
  const weeklyData: Record<number, { weights: number[]; count: number }> = {};

  recentLogs.forEach((entry) => {
    const weekNumber = differenceInWeeks(
      startOfWeek(entry.date),
      firstWeekStart,
    );
    if (!weeklyData[weekNumber]) {
      weeklyData[weekNumber] = { weights: [], count: 0 };
    }
    weeklyData[weekNumber].weights.push(entry.weight);
    weeklyData[weekNumber].count++;
  });

  const weeklyAverages = Object.entries(weeklyData)
    .map(([weekNum, data]) => ({
      week: parseInt(weekNum, 10),
      avgWeight: data.weights.reduce((sum, w) => sum + w, 0) / data.count,
    }))
    .sort((a, b) => a.week - b.week);

  if (weeklyAverages.length < 2) return null;

  // Calculate average change between consecutive weeks
  let totalChange = 0;
  let changeCount = 0;
  for (let i = 1; i < weeklyAverages.length; i++) {
    // Only count if weeks are consecutive
    if (weeklyAverages[i].week === weeklyAverages[i - 1].week + 1) {
      totalChange +=
        weeklyAverages[i].avgWeight - weeklyAverages[i - 1].avgWeight;
      changeCount++;
    }
  }

  return changeCount > 0 ? totalChange / changeCount : null;
}

function WeeklyAverageCard({ weightLog, isLoading }: WeeklyAverageCardProps) {
  const weeklyChange = React.useMemo(
    () => calculateWeeklyAverageChange(weightLog),
    [weightLog],
  );

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-xs text-gray-400">Calculating...</p>;
    }
    if (weeklyChange === null) {
      return (
        <p className="text-xs text-gray-400">
          Not enough data for weekly average.
        </p>
      );
    }

    const absChange = Math.abs(weeklyChange).toFixed(1);
    const isLoss = weeklyChange < 0;
    const isGain = weeklyChange > 0;

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
          {isLoss ? `-${absChange}` : isGain ? `+${absChange}` : "0.0"} kg/week
        </span>
      </div>
    );
  };

  return (
    <CardContainer>
      <h3 className="text-sm font-medium text-gray-300 mb-2">Weekly Average</h3>
      {renderContent()}
    </CardContainer>
  );
}

export default WeeklyAverageCard;
