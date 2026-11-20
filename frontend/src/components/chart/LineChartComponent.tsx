import React, { memo } from "react";
import { AnimatePresence, m } from "motion/react";
import {
  Area,
  CartesianGrid,
  ComposedChart,
  Legend,
  Line,
  ResponsiveContainer,
  Tooltip,
  type TooltipContentProps,
  XAxis,
  XAxisProps,
  YAxis,
  YAxisProps,
} from "recharts";
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import type { ContentType } from "recharts/types/component/Tooltip";

import { LoadingSpinner, StateCard } from "@/components/ui";
import { DURATIONS } from "@/components/utils/UiConstants";
import { formatGrouped } from "@/lib/formatNumber";

import ChartTooltip from "./ChartTooltip";
import type { ChartDataPoint, LineConfig } from "./ChartTypes";

// Interface for CustomDot props to improve type safety
interface CustomDotProps {
  cx?: number;
  cy?: number;
  index?: number;
  payload?: ChartDataPoint;
  data?: ChartDataPoint[];
  dataKey?: string;
  r?: number;
  dataLength?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: string | number;
}

// Custom dot component that adapts based on data length and hides gaps
const isGapValue = (value: unknown): boolean =>
  value === undefined || value === null;

const CustomDot = (properties: CustomDotProps) => {
  const {
    cx,
    cy,
    index,
    payload,
    data,
    dataKey,
    r = 3,
    dataLength = 0,
  } = properties;
  const value = payload && dataKey ? payload[dataKey] : undefined;

  // Don't render dot for missing/unlogged gaps
  if (isGapValue(value)) {
    return;
  }

  // Keep dots on isolated logged days bounded by gaps so they remain visible
  // even in 90-day views where normal dots are hidden to reduce clutter.
  const previousValue =
    typeof index === "number" && data && dataKey
      ? data[index - 1]?.[dataKey]
      : undefined;
  const nextValue =
    typeof index === "number" && data && dataKey
      ? data[index + 1]?.[dataKey]
      : undefined;
  const isIsolated =
    typeof index === "number" &&
    data !== undefined &&
    isGapValue(previousValue) &&
    isGapValue(nextValue);

  if (dataLength > 60 && !isIsolated) {
    return;
  }

  // Adaptive dot size based on data length
  let dotSize = r;
  if (isIsolated && dataLength > 60) {
    dotSize = Math.max(2.5, r * 0.85);
  } else if (dataLength > 30) {
    dotSize = Math.max(1.5, r * 0.7);
  } else if (dataLength > 15) {
    dotSize = Math.max(2, r * 0.85);
  }

  return (
    <circle
      cx={cx}
      cy={cy}
      r={dotSize}
      fill={properties.fill ?? properties.stroke}
      stroke={properties.stroke}
      strokeWidth="0"
    />
  );
};

interface LineChartComponentProps {
  data: ChartDataPoint[]; // Use imported type
  lines: LineConfig[]; // Use imported type
  isLoading: boolean;
  error?: string | undefined;
  emptyState?: React.ReactNode;
  tooltipContent?:
    | React.ReactElement
    | React.FC<TooltipContentProps<ValueType, NameType>>;
  chartElements?: React.ReactNode; // For <defs>, <Area>, <ReferenceLine> etc.
  xAxisProps?: Partial<XAxisProps>;
  yAxisProps?: Partial<YAxisProps>;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  showLegend?: boolean;
  className?: string; // Allow passing additional classes to the container
  height?: string | number; // Allow specifying height
  showNoDataMessage?: boolean; // Added prop to control default message visibility
}

// Adaptive interval based on data length
function getAdaptiveInterval(dataLength: number) {
  if (dataLength > 60) return Math.floor(dataLength / 8); // Show ~8 ticks for 90+ days
  if (dataLength > 30) return Math.floor(dataLength / 6); // Show ~6 ticks for 30-60 days
  if (dataLength > 15) return Math.floor(dataLength / 5); // Show ~5 ticks for 15-30 days

  return "preserveStartEnd"; // Show all ticks for shorter periods
}

const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  lines,
  isLoading,
  error,
  emptyState,
  tooltipContent,
  chartElements,
  xAxisProps: xAxisProps = {},
  yAxisProps: yAxisProps = {},
  margin = { top: 5, right: 15, left: 5, bottom: 5 },
  showLegend = true,
  className = "",
  height = "100%", // Default height
  showNoDataMessage = false, // Default to false, controlled by parent
}) => {
  const hasData = data && data.length > 0;
  // Recharts 3 shows dots before an entrance animation reaches them; 2 waited.
  const [isDrawing, setIsDrawing] = React.useState(true);
  // Assign the component or element directly; default to richer ChartTooltip
  const TooltipContent = tooltipContent ?? ChartTooltip;

  const defaultXAxisProps: Partial<XAxisProps> = {
    dataKey: "name",
    tick: { fill: "var(--text-muted)", fontSize: 11 },
    axisLine: false,
    tickLine: false,
    padding: { left: 10, right: 10 },
    interval: hasData ? getAdaptiveInterval(data.length) : "preserveStartEnd",
    height: 30, // Default height, can be overridden
    ...xAxisProps, // Merge user props
  };

  const defaultYAxisProps: Partial<YAxisProps> = {
    tick: { fill: "var(--text-muted)", fontSize: 11 },
    axisLine: false,
    tickLine: false,
    tickFormatter: (value) =>
      typeof value === "number" ? formatGrouped(value) : String(value),
    width: 40, // Default width, can be overridden
    ...yAxisProps, // Merge user props
  };

  // Determine if the default "No data" message should be shown
  const shouldShowDefaultNoData =
    !isLoading && !error && !hasData && !emptyState && showNoDataMessage;

  return (
    <div className={`relative w-full ${className} `} style={{ height }}>
      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <m.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: DURATIONS.base }}
            className="absolute inset-0 z-10 flex items-center justify-center rounded-control bg-surface"
          >
            <div className="flex flex-col items-center">
              <LoadingSpinner size="md" />
              <p className="mt-2 text-sm text-foreground">
                Loading chart data...
              </p>
            </div>
          </m.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {!isLoading && error && (
          <m.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: DURATIONS.base }}
            className="absolute inset-0 z-0 flex items-center justify-center p-4"
          >
            <StateCard
              tone="error"
              title="Couldn't load chart"
              message={error}
              size="sm"
            />
          </m.div>
        )}
      </AnimatePresence>

      {/* Empty State (Custom) */}
      <AnimatePresence>
        {!isLoading && !error && !hasData && emptyState && (
          <m.div
            key="empty-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: DURATIONS.base }}
            className="absolute inset-0 z-0 flex items-center justify-center p-4"
          >
            {emptyState}
          </m.div>
        )}
      </AnimatePresence>

      {/* Default No Data Message */}
      <AnimatePresence>
        {shouldShowDefaultNoData && (
          <m.div
            key="no-data-default"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: DURATIONS.base }}
            className="absolute inset-0 z-0 flex items-center justify-center p-4"
          >
            <StateCard
              tone="empty"
              title="No chart data yet"
              message="No data available for the selected period."
              size="sm"
            />
          </m.div>
        )}
      </AnimatePresence>

      {/* Chart Container */}
      <div
        className={`h-full w-full ${
          isLoading ||
          error ||
          (!hasData && emptyState) ||
          shouldShowDefaultNoData // Hide chart if default no data message is shown
            ? "opacity-0"
            : "opacity-100 transition-opacity duration-300"
        }`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={margin}>
            {/* Inject custom elements like <defs> */}
            {chartElements}{" "}
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="var(--color-border)"
              opacity={data.length > 60 ? 0.35 : 0.6}
            />
            <XAxis {...defaultXAxisProps} />
            <YAxis {...defaultYAxisProps} />
            <Tooltip
              // ContentType is what the prop declares; the previous cast to
              // ComponentType<Record<string, unknown>> was not assignable to it.
              content={TooltipContent as ContentType<ValueType, NameType>}
              cursor={{ fill: "var(--color-surface-3)", fillOpacity: 0.35 }}
            />
            {showLegend && (
              <Legend
                iconSize={10}
                itemSorter={null}
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                formatter={(value) => (
                  <span className="text-foreground">{value}</span>
                )}
              />
            )}{" "}
            {lines.map((line) => {
              // Adaptive styling based on data length
              const dataLength = data.length;
              const adaptiveStrokeWidth =
                dataLength > 60
                  ? 1.5
                  : dataLength > 30
                    ? 2
                    : (line.strokeWidth ?? 2);
              const adaptiveActiveDot =
                dataLength > 60
                  ? { r: 4 }
                  : dataLength > 30
                    ? { r: 5 }
                    : (line.activeDot ?? { r: 6 });
              const dot =
                isDrawing && line.isAnimationActive
                  ? false
                  : (line.dot ?? (
                      <CustomDot
                        dataKey={line.dataKey}
                        dataLength={dataLength}
                        data={data}
                      />
                    ));

              return line.isArea ? (
                <Area
                  key={line.dataKey}
                  type={line.type ?? "monotone"}
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color ?? "var(--color-muted)"}
                  fill={line.color ?? "var(--color-muted)"}
                  fillOpacity={0.15}
                  strokeWidth={adaptiveStrokeWidth}
                  activeDot={adaptiveActiveDot}
                  dot={dot}
                  connectNulls={line.connectNulls ?? false}
                  isAnimationActive={line.isAnimationActive ?? false}
                  animationDuration={line.animationDuration ?? 900}
                  onAnimationEnd={() => setIsDrawing(false)}
                />
              ) : (
                <Line
                  key={line.dataKey}
                  type={line.type ?? "monotone"}
                  dataKey={line.dataKey}
                  name={line.name}
                  stroke={line.color ?? "var(--color-muted)"}
                  strokeWidth={adaptiveStrokeWidth}
                  activeDot={adaptiveActiveDot}
                  dot={dot}
                  connectNulls={line.connectNulls ?? false}
                  isAnimationActive={line.isAnimationActive ?? false}
                  animationDuration={line.animationDuration ?? 900}
                  onAnimationEnd={() => setIsDrawing(false)}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default memo(LineChartComponent);
