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
  ReferenceLine,
  Area,
} from "recharts";
import { useStore } from "@/store/store";
import LoadingSpinner from "@/components/LoadingSpinner";
import EmptyState from "@/components/EmptyState";
import { BarChartIcon } from "@/components/Icons";
import { format, isValid, parseISO } from "date-fns"; // Import date-fns functions

// Update CustomTooltip to use the timestamp (fullDate)
function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const entryDate = parseISO(data.fullDate); // Parse the timestamp
    const isValidDate = isValid(entryDate);

    return (
      <div className="backdrop-blur-lg bg-gray-800/90 border border-gray-700/50 rounded-lg p-3 shadow-lg">
        <div className="text-base font-medium text-gray-200 mb-1">
          {/* Format the parsed date */}{" "}
          {isValidDate
            ? format(entryDate, "EEE, MMM d, yyyy 'at' p")
            : "Invalid Date"}
        </div>
        <div className="flex items-center gap-2 mt-1">
          {/* Use appropriate color based on goal? Or keep consistent? */}
          <div className="w-3 h-3 rounded-full bg-indigo-500" />
          <span className="text-sm text-gray-300">
            Weight:{" "}
            <span className="font-semibold text-indigo-300">
              {data.weight.toFixed(1)} kg
            </span>
          </span>
        </div>
      </div>
    );
  }
  return null;
}

function WeightGoalProgressChart() {
  const weightLog = useStore((state) => state.weightLog);
  const isLoading = useStore((state) => state.isLoading);
  const error = useStore((state) => state.error);
  const weightGoals = useStore((state) => state.weightGoals);

  const chartData = React.useMemo(() => {
    const log = Array.isArray(weightLog) ? weightLog : [];

    return (
      [...log]
        // Filter out entries with invalid timestamps first
        .filter(
          (entry) => entry.timestamp && isValid(parseISO(entry.timestamp))
        )
        // Sort by timestamp ascending
        .sort(
          (a, b) =>
            parseISO(a.timestamp).getTime() - parseISO(b.timestamp).getTime()
        )
        .map((entry) => {
          const entryDate = parseISO(entry.timestamp);
          return {
            // Format for X-axis label (e.g., "Apr 14")
            date: format(entryDate, "MMM d"),
            weight: entry.weight,
            // Keep the full ISO timestamp for tooltip formatting
            fullDate: entry.timestamp,
            id: entry.id,
          };
        })
    );
  }, [weightLog]);

  // Loading state
  if (isLoading) {
    return (
      <div className="h-80 flex flex-col items-center justify-center">
        <LoadingSpinner className="h-10 w-10 text-indigo-400" />
        <p className="text-gray-400 mt-3">Loading your weight data...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="h-80">
        <div className="flex flex-col items-center justify-center h-full">
          <div className="text-red-400 mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-10 w-10"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-200 mb-1">
            Error Loading Data
          </h3>
          <p className="text-center text-gray-400 max-w-md">{error}</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!chartData || chartData.length === 0) {
    return (
      <div className="h-80">
        <EmptyState
          title="Track Your Progress"
          message="Start logging your weight to see your progress charted over time."
          icon={
            <BarChartIcon
              className="h-14 w-14 text-indigo-400"
              strokeWidth={1}
            />
          }
          action={{
            label: "Log Weight",
            onClick: () => {
              // This would need to be handled by the parent component
              console.log("Open log weight modal from empty state");
            },
            variant: "outline",
          }}
          className="h-full"
        />
      </div>
    );
  }

  // Calculate Y-axis domain with appropriate padding
  const weights = chartData.map((d) => d.weight);
  const minWeight = weights.length > 0 ? Math.min(...weights) : 0; // Handle empty array
  const maxWeight = weights.length > 0 ? Math.max(...weights) : 0; // Handle empty array
  const targetWeight = weightGoals?.targetWeight;

  // Calculate appropriate Y domain with padding
  const domainMin = Math.floor(
    Math.min(minWeight, targetWeight ?? Infinity) - 1
  );
  const domainMax = Math.ceil(Math.max(maxWeight, targetWeight ?? 0) + 1);

  // Check if there's a significant trend (for gradient colors)
  const isWeightDecreasing =
    chartData.length > 1 &&
    chartData[0].weight > chartData[chartData.length - 1].weight;
  const isWeightIncreasing =
    chartData.length > 1 &&
    chartData[0].weight < chartData[chartData.length - 1].weight;

  // Get the appropriate gradient fill based on goal direction
  const getGradientId = () => {
    if (weightGoals?.weightGoal === "lose") return "loseGradient";
    if (weightGoals?.weightGoal === "gain") return "gainGradient";
    return "maintainGradient";
  };

  return (
    <div className="h-96 flex flex-col">
      <div className="text-sm text-gray-400">
        {chartData.length > 0 && (
          <span>
            {/* Format the first and last dates using parseISO */}
            {format(parseISO(chartData[0].fullDate), "MMM d, yyyy")} -{" "}
            {format(
              parseISO(chartData[chartData.length - 1].fullDate),
              "MMM d, yyyy"
            )}
          </span>
        )}
      </div>

      <div className="flex-grow">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{
              top: 10,
              right: 20,
              bottom: 20,
              left: 0,
            }}
          >
            {/* Define Gradients */}
            <defs>
              <linearGradient id="loseGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="rgb(129, 140, 248)"
                  stopOpacity={0.6}
                />
                <stop
                  offset="100%"
                  stopColor="rgb(129, 140, 248)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="gainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="rgb(52, 211, 153)"
                  stopOpacity={0.6}
                />
                <stop
                  offset="100%"
                  stopColor="rgb(52, 211, 153)"
                  stopOpacity={0}
                />
              </linearGradient>
              <linearGradient id="maintainGradient" x1="0" y1="0" x2="0" y2="1">
                <stop
                  offset="0%"
                  stopColor="rgb(59, 130, 246)"
                  stopOpacity={0.6}
                />
                <stop
                  offset="100%"
                  stopColor="rgb(59, 130, 246)"
                  stopOpacity={0}
                />
              </linearGradient>
            </defs>

            <CartesianGrid
              strokeDasharray="3 3"
              stroke="rgba(255,255,255,0.1)"
              vertical={false}
            />

            <XAxis
              dataKey="date"
              tick={{ fill: "rgb(156, 163, 175)", fontSize: 12 }}
              axisLine={{ stroke: "rgba(255,255,255,0.1)" }}
              tickLine={false}
              padding={{ left: 10, right: 10 }}
              interval="preserveStartEnd"
            />

            <YAxis
              domain={[domainMin, domainMax]}
              tick={{ fill: "rgb(156, 163, 175)", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(value) => `${value}`}
              width={30}
              label={{
                value: "kg",
                angle: -90,
                position: "insideLeft",
                fill: "rgb(156, 163, 175)",
                fontSize: 12,
                dy: 50,
              }}
            />

            <Tooltip
              content={<CustomTooltip />} // Ensure CustomTooltip uses fullDate (timestamp)
              cursor={{ stroke: "rgba(255,255,255,0.2)" }}
            />

            {/* Add Area under the curve for visual impact */}
            <Area
              type="monotone"
              dataKey="weight"
              fill={`url(#${getGradientId()})`}
              stroke="none"
              fillOpacity={0.2}
            />

            {/* Target Weight Reference Line */}
            {targetWeight && (
              <ReferenceLine
                y={targetWeight}
                stroke={
                  weightGoals?.weightGoal === "lose"
                    ? "rgba(129, 140, 248, 0.5)"
                    : weightGoals?.weightGoal === "gain"
                    ? "rgba(52, 211, 153, 0.5)"
                    : "rgba(59, 130, 246, 0.5)"
                }
                strokeDasharray="3 3"
                label={{
                  value: `Target: ${targetWeight} kg`,
                  position: "insideTopRight",
                  fill: "rgb(156, 163, 175)",
                  fontSize: 11,
                }}
              />
            )}

            {/* The main line */}
            <Line
              type="monotone"
              dataKey="weight"
              stroke={
                weightGoals?.weightGoal === "lose"
                  ? "rgb(129, 140, 248)" // Indigo for weight loss
                  : weightGoals?.weightGoal === "gain"
                  ? "rgb(52, 211, 153)" // Green for weight gain
                  : "rgb(59, 130, 246)" // Blue for maintenance
              }
              strokeWidth={2.5}
              dot={{
                r: 4,
                fill: "rgb(17, 24, 39)",
                strokeWidth: 2,
                stroke:
                  weightGoals?.weightGoal === "lose"
                    ? "rgb(129, 140, 248)"
                    : weightGoals?.weightGoal === "gain"
                    ? "rgb(52, 211, 153)"
                    : "rgb(59, 130, 246)",
              }}
              activeDot={{
                r: 6,
                fill: "rgb(17, 24, 39)",
                strokeWidth: 3,
                stroke:
                  weightGoals?.weightGoal === "lose"
                    ? "rgb(129, 140, 248)"
                    : weightGoals?.weightGoal === "gain"
                    ? "rgb(52, 211, 153)"
                    : "rgb(59, 130, 246)",
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default WeightGoalProgressChart;
