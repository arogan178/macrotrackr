import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  TooltipProps,
  XAxisProps,
  YAxisProps,
} from "recharts";
import { motion, AnimatePresence } from "motion/react";
import LoadingSpinner from "@/components/LoadingSpinner"; // Corrected path
import {
  NameType,
  ValueType,
} from "recharts/types/component/DefaultTooltipContent";
import { ChartDataPoint, LineConfig } from "../utils/types"; // Use the correct path for your types
import { DefaultTooltip } from "./chart-helpers";

interface LineChartComponentProps {
  data: ChartDataPoint[]; // Use imported type
  lines: LineConfig[]; // Use imported type
  isLoading: boolean;
  error?: string | null;
  emptyState?: React.ReactNode;
  tooltipContent?:
    | React.ReactElement
    | React.FC<TooltipProps<ValueType, NameType>>;
  chartElements?: React.ReactNode; // For <defs>, <Area>, <ReferenceLine> etc.
  xAxisProps?: Partial<XAxisProps>;
  yAxisProps?: Partial<YAxisProps>;
  margin?: { top?: number; right?: number; bottom?: number; left?: number };
  showLegend?: boolean;
  className?: string; // Allow passing additional classes to the container
  height?: string | number; // Allow specifying height
  showNoDataMessage?: boolean; // Added prop to control default message visibility
}

const LineChartComponent: React.FC<LineChartComponentProps> = ({
  data,
  lines,
  isLoading,
  error = null,
  emptyState = null,
  tooltipContent,
  chartElements = null,
  xAxisProps = {},
  yAxisProps = {},
  margin = { top: 5, right: 15, left: 5, bottom: 5 },
  showLegend = true,
  className = "",
  height = "100%", // Default height
  showNoDataMessage = false, // Default to false, controlled by parent
}) => {
  const hasData = data && data.length > 0;
  // Assign the component or element directly
  const TooltipContent = tooltipContent || DefaultTooltip;

  const defaultXAxisProps: Partial<XAxisProps> = {
    dataKey: "name",
    tick: { fill: "#9ca3af", fontSize: 11 },
    axisLine: { stroke: "rgba(75, 85, 99, 0.3)" },
    tickLine: { stroke: "rgba(75, 85, 99, 0.3)" },
    padding: { left: 10, right: 10 },
    interval: "preserveStartEnd",
    height: 30, // Default height, can be overridden
    ...xAxisProps, // Merge user props
  };

  const defaultYAxisProps: Partial<YAxisProps> = {
    tick: { fill: "#9ca3af", fontSize: 11 },
    axisLine: { stroke: "rgba(75, 85, 99, 0.3)" },
    tickLine: { stroke: "rgba(75, 85, 99, 0.3)" },
    tickFormatter: (value) =>
      typeof value === "number" ? value.toLocaleString() : String(value),
    width: 40, // Default width, can be overridden
    ...yAxisProps, // Merge user props
  };

  // Determine if the default "No data" message should be shown
  const shouldShowDefaultNoData =
    !isLoading && !error && !hasData && !emptyState && showNoDataMessage;

  return (
    <div className={`w-full relative ${className}`} style={{ height }}>
      {/* Loading State */}
      <AnimatePresence>
        {isLoading && (
          <motion.div
            key="loader"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center bg-gray-800/50 backdrop-blur-sm z-10 rounded-lg"
          >
            <div className="flex flex-col items-center">
              <LoadingSpinner size="md" />
              <p className="text-gray-400 mt-2 text-sm">
                Loading chart data...
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error State */}
      <AnimatePresence>
        {!isLoading && error && (
          <motion.div
            key="error"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center z-0 p-4"
          >
            <div className="flex flex-col items-center text-center bg-red-900/30 border border-red-700/50 rounded-lg p-6 shadow-lg">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-red-400 mb-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="text-lg font-medium text-red-200 mb-1">
                Error Loading Chart
              </h3>
              <p className="text-red-300 max-w-xs text-sm">{error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State (Custom) */}
      <AnimatePresence>
        {!isLoading && !error && !hasData && emptyState && (
          <motion.div
            key="empty-state"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center z-0 p-4"
          >
            {emptyState}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Default No Data Message */}
      <AnimatePresence>
        {shouldShowDefaultNoData && (
          <motion.div
            key="no-data-default"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 flex items-center justify-center z-0"
          >
            <div className="flex flex-col items-center text-center">
              <svg
                className="w-16 h-16 text-gray-600 mb-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.5"
                  d="M9 13h6m-3-3v6m5 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                ></path>
              </svg>
              <p className="text-gray-400 max-w-xs text-sm">
                No data available for the selected period.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chart Container */}
      <div
        className={`w-full h-full ${
          isLoading ||
          error ||
          (!hasData && emptyState) ||
          shouldShowDefaultNoData // Hide chart if default no data message is shown
            ? "opacity-0"
            : "opacity-100 transition-opacity duration-300"
        }`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={margin}>
            {/* Inject custom elements like <defs> */}
            {chartElements}

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(75, 85, 99, 0.2)"
            />

            <XAxis {...defaultXAxisProps} />
            <YAxis {...defaultYAxisProps} />

            <Tooltip
              // Pass the component/element directly to the content prop
              content={TooltipContent}
              cursor={{ fill: "rgba(110, 118, 145, 0.1)" }}
            />

            {showLegend && (
              <Legend
                iconSize={10}
                wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }}
                formatter={(value) => (
                  <span className="text-gray-400">{value}</span>
                )}
              />
            )}

            {lines.map((line) => (
              <Line
                key={line.dataKey}
                type={line.type || "monotone"}
                dataKey={line.dataKey}
                name={line.name}
                stroke={line.color || "#8884d8"} // Default color if not provided
                strokeWidth={line.strokeWidth || 2}
                activeDot={line.activeDot ?? { r: 6 }}
                dot={line.dot ?? { r: 2 }}
                connectNulls={line.connectNulls ?? false}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LineChartComponent;
