import React from "react";

import { CardContainer } from "@/components/form";
import { TrendingDownIcon, TrendingUpIcon } from "@/components/ui";
import { calculateMonthlyTrend } from "@/features/goals/utils/progressAnalytics";
import { WeightLogEntry } from "@/utils/apiServices";

interface MonthlyTrendCardProps {
  weightLog: WeightLogEntry[];
  isLoading: boolean;
}

function MonthlyTrendCard({ weightLog, isLoading }: MonthlyTrendCardProps) {
  const monthlyChange = React.useMemo(
    () => calculateMonthlyTrend(weightLog),
    [weightLog],
  );

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-xs text-foreground">Calculating...</p>;
    }
    if (monthlyChange === undefined) {
      return (
        <p className="text-xs text-foreground">
          Not enough data for monthly trend.
        </p>
      );
    }

    const absChange = Math.abs(monthlyChange).toFixed(1);
    const isLoss = monthlyChange < 0;
    const isGain = monthlyChange > 0;

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
          {isLoss ? `-${absChange}` : isGain ? `+${absChange}` : "0.0"} kg
        </span>
        <span className="ml-1.5 text-xs text-foreground">
          in last ~3 months
        </span>
      </div>
    );
  };

  return (
    <CardContainer>
      <h3 className="mb-2 text-sm font-medium text-foreground">
        Monthly Trend
      </h3>
      {renderContent()}
    </CardContainer>
  );
}

export default MonthlyTrendCard;
