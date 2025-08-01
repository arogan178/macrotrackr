import {
  differenceInWeeks,
  isValid,
  parseISO,
  startOfWeek,
  subWeeks,
} from "date-fns";
import React from "react";

import { CardContainer } from "@/components/form"; // Assuming CardContainer exists
import { TrendingDownIcon, TrendingUpIcon } from "@/components/ui"; // Assuming these exist
import { WeightLogEntry } from "@/utils/apiServices";

interface WeeklyAverageCardProps {
  weightLog: WeightLogEntry[];
  isLoading: boolean;
}

// Helper to calculate weekly average change
function calculateWeeklyAverageChange(
  log: WeightLogEntry[],
): number | undefined {
  if (log.length < 2) return undefined;

  const now = new Date();
  const fourWeeksAgo = subWeeks(now, 4);

  // Filter logs for the last 4 full weeks + current partial week
  const recentLogs = log
    .map((entry) => ({ ...entry, date: parseISO(entry.timestamp) }))
    .filter(
      (entry) => isValid(entry.date) && entry.date >= startOfWeek(fourWeeksAgo),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (recentLogs.length < 2) return undefined;

  // Group logs by week number (relative to the start of the period)
  const firstWeekStart = startOfWeek(recentLogs[0].date);
  const weeklyData: Record<number, { weights: number[]; count: number }> = {};

  for (const entry of recentLogs) {
    const weekNumber = differenceInWeeks(
      startOfWeek(entry.date),
      firstWeekStart,
    );
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

  // Calculate average change between consecutive weeks
  let totalChange = 0;
  let changeCount = 0;
  for (let index = 1; index < weeklyAverages.length; index++) {
    // Only count if weeks are consecutive
    if (weeklyAverages[index].week === weeklyAverages[index - 1].week + 1) {
      totalChange +=
        weeklyAverages[index].avgWeight - weeklyAverages[index - 1].avgWeight;
      changeCount++;
    }
  }

  return changeCount > 0 ? totalChange / changeCount : undefined;
}

function WeeklyAverageCard({ weightLog, isLoading }: WeeklyAverageCardProps) {
  const weeklyChange = React.useMemo(
    () => calculateWeeklyAverageChange(weightLog),
    [weightLog],
  );

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-xs text-foreground">Calculating...</p>;
    }
    if (weeklyChange === undefined) {
      return (
        <p className="text-xs text-foreground">
          Not enough data for weekly average.
        </p>
      );
    }

    const absChange = Math.abs(weeklyChange).toFixed(1);
    const isLoss = weeklyChange < 0;
    const isGain = weeklyChange > 0;

    return (
      <div className="flex items-center">
        {isLoss && <TrendingDownIcon className="mr-2 h-5 w-5 text-primary" />}
        {isGain && <TrendingUpIcon className="mr-2 h-5 w-5 text-success" />}
        <span
          className={`text-lg font-semibold ${
            isLoss
              ? "text-primary"
              : isGain
                ? "text-success"
                : "text-foreground"
          }`}
        >
          {isLoss ? `-${absChange}` : isGain ? `+${absChange}` : "0.0"} kg/week
        </span>
      </div>
    );
  };

  return (
    <CardContainer>
      <h3 className="mb-2 text-sm font-medium text-foreground">
        Weekly Average
      </h3>
      {renderContent()}
    </CardContainer>
  );
}

export default WeeklyAverageCard;
