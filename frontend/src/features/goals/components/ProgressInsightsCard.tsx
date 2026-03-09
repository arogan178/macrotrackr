import {
  differenceInWeeks,
  isValid,
  parseISO,
  startOfWeek,
  subWeeks,
} from "date-fns";
import React from "react";

import { CardContainer } from "@/components/form";
import { LightBulbIcon } from "@/components/ui"; // Assuming this exists
import { WeightGoals } from "@/types/goal";
import { WeightLogEntry } from "@/utils/apiServices";

interface ProgressInsightsCardProps {
  weightLog: WeightLogEntry[];
  weightGoals: WeightGoals | undefined | null;
  isLoading: boolean;
}

// Re-use or adapt weekly change calculation (simplified version here)
function calculateRecentWeeklyChange(
  log: WeightLogEntry[],
): number | undefined {
  if (log.length < 2) return undefined;

  const now = new Date();
  const fourWeeksAgo = subWeeks(now, 4);

  const recentLogs = log
    .map((entry) => ({ ...entry, date: parseISO(entry.timestamp) }))
    .filter(
      (entry) => isValid(entry.date) && entry.date >= startOfWeek(fourWeeksAgo),
    )
    .sort((a, b) => a.date.getTime() - b.date.getTime());

  if (recentLogs.length < 2) return undefined;

  // Simple trend: change between first and last point in the last 4 weeks
  const firstLog = recentLogs[0];
  // eslint-disable-next-line unicorn/prefer-at
  const lastLog = recentLogs[recentLogs.length - 1];
  const weeksBetween = differenceInWeeks(lastLog.date, firstLog.date);

  if (weeksBetween <= 0) return undefined; // Avoid division by zero or nonsensical results

  return (lastLog.weight - firstLog.weight) / weeksBetween;
}

function ProgressInsightsCard({
  weightLog,
  weightGoals,
  isLoading,
}: ProgressInsightsCardProps) {
  const getInsight = React.useCallback((): {
    message: string;
    color: string;
  } => {
    if (isLoading) {
      return { message: "Analyzing progress...", color: "text-muted" };
    }
    if (!weightGoals || weightGoals.weightGoal === "maintain") {
      return {
        message: "Set a weight loss or gain goal to see insights.",
        color: "text-muted",
      };
    }

    const actualWeeklyChange = calculateRecentWeeklyChange(weightLog);

    if (actualWeeklyChange === undefined) {
      return {
        message: "Log weight consistently for progress insights.",
        color: "text-muted",
      };
    }

    const targetWeeklyChange = weightGoals.weeklyChange || 0;
    const goalType = weightGoals.weightGoal; // 'lose' or 'gain'

    // Tolerance for being "on track"
    const tolerance = 0.1; // e.g., +/- 0.1 kg/week

    if (goalType === "lose") {
      if (actualWeeklyChange < targetWeeklyChange - tolerance) {
        return {
          message: "Progressing faster than planned. Ensure it's sustainable.",
          color: "text-warning",
        };
      }
      if (actualWeeklyChange > targetWeeklyChange + tolerance) {
        return {
          message: "Slightly behind schedule. Stay consistent!",
          color: "text-warning",
        };
      }
      return {
        message: "Great consistency! You're on track to reach your goal.",
        color: "text-primary",
      };
    }

    if (goalType === "gain") {
      if (actualWeeklyChange > targetWeeklyChange + tolerance) {
        return {
          message: "Progressing faster than planned. Ensure it's sustainable.",
          color: "text-warning",
        };
      }
      if (actualWeeklyChange < targetWeeklyChange - tolerance) {
        return {
          message: "Slightly behind schedule. Stay consistent!",
          color: "text-warning",
        };
      }
      return {
        message: "Great consistency! You're on track to reach your goal.",
        color: "text-success",
      };
    }

    return {
      message: "Keep logging to see more insights.",
      color: "text-muted",
    };
  }, [weightLog, weightGoals, isLoading]);

  const insight = getInsight();

  return (
    <CardContainer>
      <h3 className="mb-2 text-sm font-medium text-foreground">
        Progress Insights
      </h3>
      <div className="flex items-start">
        <LightBulbIcon
          className={` ${insight.color} mt-0.5 mr-2 flex-shrink-0`}
        />
        <p className={`text-sm ${insight.color}`}>{insight.message}</p>
      </div>
    </CardContainer>
  );
}

export default ProgressInsightsCard;
