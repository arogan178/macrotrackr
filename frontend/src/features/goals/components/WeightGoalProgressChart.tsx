import { format, isValid, parseISO } from "date-fns";
import React from "react";
import { Area, ReferenceLine, TooltipProps } from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import { LineChartComponent } from "@/components/chart";
import { BarChartIcon, EmptyState } from "@/components/ui";
import { getChartDomain } from "@/features/goals/utils/progressAnalytics";
import { useWeightGoals, useWeightLog } from "@/hooks/queries/useGoals";

// Custom Tooltip specific to Weight Goal Progress
function WeightCustomTooltip({
  active,
  payload,
  label,
}: TooltipProps<ValueType, NameType>) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const entryDate =
      data.fullDate && typeof data.fullDate === "string"
        ? parseISO(data.fullDate)
        : undefined;
    const isValidDate = entryDate && isValid(entryDate);

    return (
      <div className="rounded-lg border border-border/50 bg-surface p-3 shadow-primary backdrop-blur-lg">
        <div className="mb-1 text-base font-medium text-foreground">
          {isValidDate
            ? format(entryDate, "EEE, MMM d, yyyy 'at' p")
            : label || "Date Unavailable"}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div
            className={"h-3 w-3 rounded-full"}
            style={{ backgroundColor: payload[0].color || payload[0].stroke }}
          ></div>
          <span className="text-sm text-foreground">
            Weight:{" "}
            <span
              className="font-semibold"
              style={{ color: payload[0].color || payload[0].stroke }}
            >
              {typeof data.weight === "number" ? data.weight.toFixed(1) : "N/A"}{" "}
              kg
            </span>
          </span>
        </div>
      </div>
    );
  }
  return;
}

function WeightGoalProgressChart() {
  const { data: weightLog = [], isLoading: weightLogLoading } = useWeightLog();
  const { data: weightGoals, isLoading: weightGoalsLoading } = useWeightGoals();
  const isLoading = weightLogLoading || weightGoalsLoading;
  const error = undefined; // TanStack Query handles errors differently

  const chartData = React.useMemo(() => {
    const log = Array.isArray(weightLog) ? weightLog : [];

    const grouped: Record<
      string,
      { weights: number[]; ids: string[]; timestamps: string[] }
    > = {};
    for (const entry of log) {
      if (!entry.timestamp || !isValid(parseISO(entry.timestamp))) continue;
      const dateKey = format(parseISO(entry.timestamp), "yyyy-MM-dd");
      if (!grouped[dateKey])
        grouped[dateKey] = { weights: [], ids: [], timestamps: [] };
      grouped[dateKey].weights.push(entry.weight);
      grouped[dateKey].ids.push(entry.id);
      grouped[dateKey].timestamps.push(entry.timestamp);
    }

    return Object.entries(grouped)
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([dateKey, { weights, ids, timestamps }]) => {
        const avgWeight =
          weights.reduce((sum, w) => sum + w, 0) / (weights.length || 1);
        const sortedTimestamps = [...timestamps].sort(
          (a, b) => parseISO(a).getTime() - parseISO(b).getTime(),
        );
        return {
          name: format(parseISO(dateKey), "MMM d"),
          weight: avgWeight,
          fullDate: sortedTimestamps[0],
          id: ids[0],
        };
      });
  }, [weightLog]);

  // Calculate Y-axis domain using shared helper for identical behavior
  const { domainMin, domainMax } = React.useMemo(() => {
    const weights = chartData.map((d) => d.weight);
    return getChartDomain(weights, weightGoals?.targetWeight);
  }, [chartData, weightGoals?.targetWeight]);

  // Determine line color and gradient based on goal
  const { lineColor, gradientId } = React.useMemo(() => {
    switch (weightGoals?.weightGoal) {
      case "lose": {
        return { lineColor: "rgb(129, 140, 248)", gradientId: "loseGradient" };
      } // Indigo
      case "gain": {
        return { lineColor: "rgb(52, 211, 153)", gradientId: "gainGradient" };
      } // Green
      default: {
        return {
          lineColor: "rgb(59, 130, 246)",
          gradientId: "maintainGradient",
        };
      } // Blue
    }
  }, [weightGoals?.weightGoal]);

  const targetWeight = weightGoals?.targetWeight;

  // Define chart elements (gradients, area, reference line)
  const chartElements = (
    <>
      <defs>
        <linearGradient id="loseGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(129, 140, 248)" stopOpacity={0.4} />
          <stop offset="100%" stopColor="rgb(129, 140, 248)" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="gainGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(52, 211, 153)" stopOpacity={0.4} />
          <stop offset="100%" stopColor="rgb(52, 211, 153)" stopOpacity={0} />
        </linearGradient>
        <linearGradient id="maintainGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgb(59, 130, 246)" stopOpacity={0.4} />
          <stop offset="100%" stopColor="rgb(59, 130, 246)" stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="weight"
        fill={`url(#${gradientId})`}
        stroke="none"
        fillOpacity={0.3}
      />
      {targetWeight && (
        <ReferenceLine
          y={targetWeight}
          stroke={lineColor}
          strokeOpacity={0.5}
          strokeDasharray="4 4"
          label={{
            value: `Target: ${targetWeight} kg`,
            position: "insideTopRight",
            fill: "rgb(156, 163, 175)",
            fontSize: 11,
            dy: -5,
            dx: -5,
          }}
        />
      )}
    </>
  );

  const lines = [
    {
      dataKey: "weight",
      color: lineColor,
      strokeWidth: 2.5,
      dot: {
        r: 3,
        fill: "rgb(17, 24, 39)",
        strokeWidth: 1.5,
        stroke: lineColor,
      },
      activeDot: {
        r: 5,
        fill: "rgb(17, 24, 39)",
        strokeWidth: 2,
        stroke: lineColor,
      },
      connectundefineds: true,
    },
  ];

  const xAxisProps = {
    dataKey: "name",
    axisLine: { stroke: "rgba(255,255,255,0.1)" },
    tickLine: false,
  };

  const yAxisProps = {
    domain: [domainMin, domainMax],
    axisLine: false,
    tickLine: false,
    tickFormatter: (value: number) => `${value}`,
    width: 35,
    label: {
      value: "kg",
      angle: -90,
      position: "insideLeft",
      fill: "rgb(156, 163, 175)",
      fontSize: 12,
      dy: 40,
      dx: -5,
    },
  };

  const emptyStateComponent = (
    <EmptyState
      title="Track Your Progress"
      message="Start logging your weight to see your progress charted over time."
      icon={<BarChartIcon className="h-14 w-14 text-primary" strokeWidth={1} />}
      action={{
        label: "Log Weight",
        onClick: () => {
          // TODO: Implement modal opening logic, likely via parent state/context
        },
        variant: "outline",
      }}
      className="h-full"
    />
  );

  return (
    <div className="flex h-96 flex-col">
      <div className="mb-2 h-5 text-sm text-foreground">
        {chartData.length > 0 && (
          <span>
            {format(parseISO(chartData[0].fullDate), "MMM d, yyyy")} -{" "}
            {format(
              parseISO(
                chartData.length > 0 ? (chartData.at(-1)?.fullDate ?? "") : "",
              ),
              "MMM d, yyyy",
            )}
          </span>
        )}
      </div>
      <div className="flex-grow">
        <LineChartComponent
          data={chartData as any}
          lines={lines}
          isLoading={isLoading}
          error={error}
          emptyState={emptyStateComponent}
          showNoDataMessage={chartData.length === 0}
          tooltipContent={<WeightCustomTooltip />}
          chartElements={chartElements}
          xAxisProps={xAxisProps}
          yAxisProps={yAxisProps}
          margin={{ top: 10, right: 25, bottom: 5, left: 5 }}
          showLegend={false}
          height="100%"
        />
      </div>
    </div>
  );
}

export default WeightGoalProgressChart;
