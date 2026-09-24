import React from "react";
import { format, isValid, parseISO } from "date-fns";
import { Area, ReferenceLine, TooltipProps } from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import type { ChartDataPoint } from "@/components/chart/ChartTypes";
import LineChartComponent from "@/components/chart/LineChartComponent";
import { BarChartIcon, StateCard } from "@/components/ui";
import { getChartDomain } from "@/features/goals/utils/progressAnalytics";
import { useWeightGoals, useWeightLog } from "@/hooks/queries/useGoals";
import { useStore } from "@/store/store";

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
      <div className="rounded-control border border-border bg-surface p-3">
        <div className="mb-1 text-base font-medium text-foreground">
          {isValidDate
            ? format(entryDate, "EEE, MMM d, yyyy 'at' p")
            : (label ?? "Date Unavailable")}
        </div>
        <div className="mt-1 flex items-center gap-2">
          <div
            className={"h-3 w-3 rounded-full"}
            style={{ backgroundColor: payload[0].color ?? payload[0].stroke }}
          />
          <span className="text-sm text-foreground">
            Weight:{" "}
            <span
              className="font-semibold"
              style={{ color: payload[0].color ?? payload[0].stroke }}
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
  const setLogWeightModalOpen = useStore(
    (state) => state.setLogWeightModalOpen,
  );
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

  // Weight is a live value, not a macro, so it is the brand green whichever
  // way the goal points.
  const lineColor = "var(--color-primary)";

  const targetWeight = weightGoals?.targetWeight;

  // Define chart elements (gradients, area, reference line)
  const chartElements = (
    <>
      <defs>
        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={lineColor} stopOpacity={0.4} />
          <stop offset="100%" stopColor={lineColor} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="weight"
        fill="url(#weightGradient)"
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
            fill: "var(--color-muted)",
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
        fill: "var(--color-surface)",
        strokeWidth: 1.5,
        stroke: lineColor,
      },
      activeDot: {
        r: 5,
        fill: "var(--color-surface)",
        strokeWidth: 2,
        stroke: lineColor,
      },
      connectundefineds: true,
    },
  ];

  const xAxisProps = {
    dataKey: "name",
    axisLine: { stroke: "var(--color-border)" },
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
      fill: "var(--color-muted)",
      fontSize: 12,
      dy: 40,
      dx: -5,
    },
  };

  const emptyStateComponent = (
    <StateCard
      title="Track Your Progress"
      message="Start logging your weight to see your progress charted over time."
      icon={<BarChartIcon className="h-14 w-14 text-primary" strokeWidth={1} />}
      action={{
        label: "Log Weight",
        onClick: () => setLogWeightModalOpen(true),
        variant: "ghost",
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
                chartData.length > 0
                  ? (chartData[chartData.length - 1]?.fullDate ?? "")
                  : "",
              ),
              "MMM d, yyyy",
            )}
          </span>
        )}
      </div>
      <div className="grow">
        <LineChartComponent
          data={chartData as ChartDataPoint[]}
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
