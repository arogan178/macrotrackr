import React from "react";
import { calculateTrendWeights, TREND_SMOOTHING } from "@shared/trendWeight";
import { format, isValid, parseISO } from "date-fns";
import { Area, ReferenceLine, type TooltipContentProps } from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";

import type { ChartDataPoint } from "@/components/chart/ChartTypes";
import LineChartComponent from "@/components/chart/LineChartComponent";
import { BarChartIcon, StateCard } from "@/components/ui";
import { CHART_COLORS } from "@/features/goals/constants";
import { getChartDomain } from "@/features/goals/utils/progressAnalytics";
import { useWeightGoals, useWeightLog } from "@/hooks/queries/useGoals";
import { formatGrouped } from "@/lib/formatNumber";
import { useStore } from "@/store/store";
import {
  formatWeight,
  fromKg,
  type UnitSystem,
  weightUnit,
} from "@/utils/unitConversion";

// Weight is a live value, not a macro, so weigh-ins stay the brand green.
const WEIGH_IN_COLOR = "var(--color-primary)";
const TREND_COLOR = CHART_COLORS.trend;

// Custom Tooltip specific to Weight Goal Progress
function WeightCustomTooltip({
  active,
  payload,
  label,
  unit,
}: Partial<TooltipContentProps<ValueType, NameType>> & { unit: string }) {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const entryDate =
      data.fullDate && typeof data.fullDate === "string"
        ? parseISO(data.fullDate)
        : undefined;
    const isValidDate = entryDate && isValid(entryDate);
    const rows = [
      { label: "Trend", value: data.trend, color: TREND_COLOR },
      { label: "Weigh-in", value: data.weight, color: WEIGH_IN_COLOR },
    ];

    return (
      <div className="rounded-control border border-border bg-surface p-3">
        <div className="mb-1 text-base font-medium text-foreground">
          {isValidDate
            ? format(entryDate, "EEE, MMM d, yyyy")
            : (label ?? "Date Unavailable")}
        </div>
        {rows.map((row) => (
          <div key={row.label} className="mt-1 flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: row.color }}
            />
            <span className="text-sm text-foreground">
              {row.label}:{" "}
              <span className="font-semibold" style={{ color: row.color }}>
                {typeof row.value === "number"
                  ? `${formatGrouped(row.value, 1)} ${unit}`
                  : "Not logged"}
              </span>
            </span>
          </div>
        ))}
      </div>
    );
  }

  return;
}

// Plotted in the user's unit so the axis, target line and tooltip agree.
function WeightGoalProgressChart({
  unitSystem = "metric",
}: {
  unitSystem?: UnitSystem;
}) {
  const unit = weightUnit(unitSystem);
  const { data: weightLog = [], isLoading: weightLogLoading } = useWeightLog();
  const { data: weightGoals, isLoading: weightGoalsLoading } = useWeightGoals();
  const setLogWeightModalOpen = useStore(
    (state) => state.setLogWeightModalOpen,
  );
  const isLoading = weightLogLoading || weightGoalsLoading;
  const error = undefined; // TanStack Query handles errors differently

  const chartData = React.useMemo(
    () =>
      calculateTrendWeights(Array.isArray(weightLog) ? weightLog : []).map(
        (point) => ({
          name: format(parseISO(point.date), "MMM d"),
          fullDate: point.date,
          weight:
            point.weight === null ? undefined : fromKg(point.weight, unitSystem),
          trend: fromKg(point.trend, unitSystem),
        }),
      ),
    [weightLog, unitSystem],
  );

  const targetWeight = weightGoals?.targetWeight;
  const plottedTarget =
    targetWeight === undefined ? undefined : fromKg(targetWeight, unitSystem);

  // Calculate Y-axis domain using shared helper for identical behavior
  const { domainMin, domainMax } = React.useMemo(() => {
    const weights = chartData.flatMap((d) =>
      d.weight === undefined ? [d.trend] : [d.weight, d.trend],
    );

    return getChartDomain(weights, plottedTarget);
  }, [chartData, plottedTarget]);

  const chartElements = (
    <>
      <defs>
        <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={TREND_COLOR} stopOpacity={0.4} />
          <stop offset="100%" stopColor={TREND_COLOR} stopOpacity={0} />
        </linearGradient>
      </defs>
      <Area
        type="monotone"
        dataKey="trend"
        fill="url(#weightGradient)"
        stroke="none"
        fillOpacity={0.3}
        tooltipType="none"
      />
      {targetWeight && (
        <ReferenceLine
          y={plottedTarget}
          stroke={WEIGH_IN_COLOR}
          strokeOpacity={0.5}
          strokeDasharray="4 4"
          label={{
            value: `Target: ${formatWeight(targetWeight, unitSystem)}`,
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

  // Raw weigh-ins are dots only; the trend is the line to read.
  const lines = [
    {
      dataKey: "trend",
      color: TREND_COLOR,
      strokeWidth: 2.5,
      dot: false,
      activeDot: { r: 4, fill: TREND_COLOR, strokeWidth: 0 },
    },
    {
      dataKey: "weight",
      color: "none",
      dot: {
        r: 3,
        fill: "var(--color-surface)",
        strokeWidth: 1.5,
        stroke: WEIGH_IN_COLOR,
      },
      activeDot: {
        r: 5,
        fill: "var(--color-surface)",
        strokeWidth: 2,
        stroke: WEIGH_IN_COLOR,
      },
    },
  ];

  const xAxisProps = {
    dataKey: "name",
    axisLine: false,
    tickLine: false,
    // Drop ticks by measured width: a count-based interval ran the dates
    // together on a phone.
    interval: "preserveStartEnd" as const,
    minTickGap: 16,
  };

  const yAxisProps = {
    domain: [domainMin, domainMax],
    axisLine: false,
    tickLine: false,
    tickFormatter: (value: number) => `${value}`,
    width: 35,
    label: {
      value: unit,
      angle: -90,
      position: "insideLeft" as const,
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
          tooltipContent={<WeightCustomTooltip unit={unit} />}
          chartElements={chartElements}
          xAxisProps={xAxisProps}
          yAxisProps={yAxisProps}
          margin={{ top: 10, right: 25, bottom: 5, left: 5 }}
          showLegend={false}
          height="100%"
        />
      </div>
      {chartData.length > 0 && (
        <div className="mt-2 space-y-1 text-xs text-muted">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <span
                className="h-0.5 w-4 rounded-full"
                style={{ backgroundColor: TREND_COLOR }}
              />
              Trend
            </span>
            <span className="flex items-center gap-1.5">
              <span
                className="h-2 w-2 rounded-full border-[1.5px]"
                style={{ borderColor: WEIGH_IN_COLOR }}
              />
              Weigh-ins
            </span>
          </div>
          <p>
            Trend moves {TREND_SMOOTHING * 100}% of the way toward each
            day&apos;s weight. Missed days are filled in a straight line.
          </p>
        </div>
      )}
    </div>
  );
}

export default WeightGoalProgressChart;
