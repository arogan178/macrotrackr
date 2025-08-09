import React from "react";

import { CardContainer } from "@/components/form";
import { TrendingDownIcon, TrendingUpIcon } from "@/components/ui";
import { calculateWeeklyAverageChange } from "@/features/goals/utils/progressAnalytics";
import { WeightLogEntry } from "@/utils/apiServices";

interface WeeklyAverageCardProps {
  weightLog: WeightLogEntry[];
  isLoading: boolean;
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
        {isLoss && <TrendingDownIcon className="mr-2  text-primary" />}
        {isGain && <TrendingUpIcon className="mr-2  text-success" />}
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
