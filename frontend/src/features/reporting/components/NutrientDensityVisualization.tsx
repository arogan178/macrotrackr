import { motion } from "motion/react";
import { useMemo } from "react";
// Custom tooltip component
import type { TooltipProps } from "recharts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { MACRO_COLORS } from "@/utils/chartColors";
import { formatDateName, getMacroPercentages } from "@/utils/chartUtilities";

interface NutrientDensityVisualizationProps {
  data: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }[];
  selectedRange: 7 | 30 | 90;
  isLoading?: boolean;
  dataProcessed?: boolean;
}

// --- Subcomponents ---

interface PercentageLabelProps {
  x?: string | number;
  y?: string | number;
  width?: string | number;
  height?: string | number;
  value?: string | number;
}

const PercentageLabel = (properties: PercentageLabelProps) => {
  // Convert to number if possible, else default to 0
  const toNumber = (value_: string | number | undefined) =>
    typeof value_ === "number" ? value_ : value_ ? Number(value_) : 0;
  const x = toNumber(properties.x);
  const y = toNumber(properties.y);
  const width = toNumber(properties.width);
  const height = toNumber(properties.height);
  const value =
    typeof properties.value === "number"
      ? properties.value
      : properties.value
        ? Number(properties.value)
        : 0;
  // Only show label if value is significant enough to fit
  if (value < 5 || width < 20) return;
  return (
    <text
      x={x + width / 2} // Center label horizontally
      y={y + height / 2}
      fill="#ffffff"
      fontSize={12} // Slightly smaller font size
      textAnchor="middle" // Center text
      dominantBaseline="central"
      fontWeight={600}
    >
      {`${value}%`}
    </text>
  );
};

// --- Main Component ---

function NutrientDensityVisualization({
  data,
  selectedRange,
  isLoading = false,
  dataProcessed = true,
}: NutrientDensityVisualizationProps) {
  // Calculate the optimal number of items to display based on the range
  const displayLimit = useMemo(() => {
    const range = selectedRange || 7; // Default to 7 if selectedRange is undefined
    if (range <= 7) {
      // Daily view
      return range; // e.g., 7 bars for 7 days
    } else if (range <= 30) {
      // Weekly view
      return Math.ceil(range / 7); // e.g., Math.ceil(30 / 7) = 5 bars for 30 days
    } else {
      // Monthly view (for 90 days)
      return Math.ceil(range / 30); // e.g., Math.ceil(90 / 30) = 3 bars for 90 days
    }
  }, [selectedRange]);
  const chartData = useMemo(() => {
    // Default to 7 days if selectedRange is undefined
    const range = selectedRange || 7;

    // For 7 days or less, ensure we always have the correct number of entries
    if (range <= 7) {
      // Create a complete date range for the expected number of days
      const today = new Date();
      const completeRange = Array.from({ length: range }, (_, index) => {
        const dayOffset = range - index - 1;
        const entryDate = new Date(today);
        entryDate.setDate(today.getDate() - dayOffset);

        const expectedDateName = entryDate.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        // Find matching data for this date
        const matchingData = data.find(
          (item) => item.name === expectedDateName,
        );

        return (
          matchingData || {
            name: expectedDateName,
            calories: 0,
            protein: 0,
            carbs: 0,
            fats: 0,
          }
        );
      });

      const processedData = completeRange;

      return processedData
        .map((entry) => {
          const { proteinPct, carbsPct, fatsPct } = getMacroPercentages(entry);
          const hasNoMacros =
            entry.protein === 0 && entry.carbs === 0 && entry.fats === 0;

          return {
            name: formatDateName(entry, range),
            protein: hasNoMacros ? 0 : proteinPct,
            carbs: hasNoMacros ? 0 : carbsPct,
            fats: hasNoMacros ? 0 : fatsPct,
            emptyBar: hasNoMacros ? 100 : 0,
            gProtein: entry.protein.toFixed(1),
            gCarbs: entry.carbs.toFixed(1),
            gFats: entry.fats.toFixed(1),
            calories: entry.calories,
            hasNoMacros,
          };
        })
        .reverse();
    }

    // Get the data for longer ranges
    const slicedData = data.slice(-range);

    // For longer ranges (30 or 90 days), group data
    const groupSize = Math.ceil(slicedData.length / displayLimit);

    // For 30-day view
    if (range <= 30) {
      const groupedData = [];

      for (let index = 0; index < slicedData.length; index += groupSize) {
        const group = slicedData.slice(index, index + groupSize);
        if (group.length === 0) continue;

        const firstEntry = group[0];
        const lastEntry = group[-1];
        const groupLabel =
          group.length === 1
            ? firstEntry.name
            : `${firstEntry.name} - ${lastEntry.name}`;

        const groupAvg = {
          name: groupLabel,
          protein:
            group.reduce((sum, entry) => sum + entry.protein, 0) / group.length,
          carbs:
            group.reduce((sum, entry) => sum + entry.carbs, 0) / group.length,
          fats:
            group.reduce((sum, entry) => sum + entry.fats, 0) / group.length,
          calories:
            group.reduce((sum, entry) => sum + entry.calories, 0) /
            group.length,
        };

        const { proteinPct, carbsPct, fatsPct } = getMacroPercentages(groupAvg);
        const hasNoMacros =
          groupAvg.protein === 0 && groupAvg.carbs === 0 && groupAvg.fats === 0;

        groupedData.push({
          name: groupAvg.name,
          protein: hasNoMacros ? 0 : proteinPct,
          carbs: hasNoMacros ? 0 : carbsPct,
          fats: hasNoMacros ? 0 : fatsPct,
          emptyBar: hasNoMacros ? 100 : 0,
          gProtein: groupAvg.protein.toFixed(1),
          gCarbs: groupAvg.carbs.toFixed(1),
          gFats: groupAvg.fats.toFixed(1),
          calories: Math.round(groupAvg.calories),
          hasNoMacros,
          originalDateRange: `${firstEntry.name} to ${lastEntry.name}`,
        });
      }

      return groupedData.reverse();
    }
    // For 90+ days view
    else {
      const monthAggregates = new Map();
      const monthOrder: string[] = [];

      for (const entry of slicedData) {
        const month = entry.name.split(" ")[0];
        if (!monthAggregates.has(month)) {
          monthAggregates.set(month, {
            proteinSum: 0,
            carbsSum: 0,
            fatsSum: 0,
            caloriesSum: 0,
            count: 0,
            originalNamesInMonth: [],
          });
          monthOrder.push(month);
        }

        const aggregate = monthAggregates.get(month);
        aggregate.proteinSum += entry.protein;
        aggregate.carbsSum += entry.carbs;
        aggregate.fatsSum += entry.fats;
        aggregate.caloriesSum += entry.calories;
        aggregate.count += 1;
      }

      let monthlyChartData = monthOrder.map((monthName) => {
        const { proteinSum, carbsSum, fatsSum, caloriesSum, count } =
          monthAggregates.get(monthName);

        const monthAvg = {
          name: monthName,
          protein: proteinSum / count,
          carbs: carbsSum / count,
          fats: fatsSum / count,
          calories: caloriesSum / count,
        };

        const { proteinPct, carbsPct, fatsPct } = getMacroPercentages(monthAvg);
        const hasNoMacros =
          monthAvg.protein === 0 && monthAvg.carbs === 0 && monthAvg.fats === 0;

        return {
          name: monthName,
          protein: hasNoMacros ? 0 : proteinPct,
          carbs: hasNoMacros ? 0 : carbsPct,
          fats: hasNoMacros ? 0 : fatsPct,
          emptyBar: hasNoMacros ? 100 : 0,
          gProtein: monthAvg.protein.toFixed(1),
          gCarbs: monthAvg.carbs.toFixed(1),
          gFats: monthAvg.fats.toFixed(1),
          calories: Math.round(monthAvg.calories),
          hasNoMacros,
        };
      });

      // Display the latest 'displayLimit' months
      if (monthlyChartData.length > displayLimit) {
        monthlyChartData = monthlyChartData.slice(-displayLimit);
      }

      return monthlyChartData.reverse();
    }
  }, [data, selectedRange, displayLimit]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-gray-800/70 rounded-xl border border-gray-700/30 p-3 shadow-lg flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-white">
          Macro Distribution
        </h3>
      </div>{" "}
      {/* Chart Section */}
      <div className="h-[300px]">
        {isLoading || !dataProcessed ? (
          <div className="flex items-center justify-center h-full">
            <div className="animate-pulse text-gray-400 text-sm">
              Loading macro distribution...
            </div>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              stackOffset="expand"
              layout="vertical"
              margin={{ top: 15, right: 30, left: 0, bottom: 10 }}
              barSize={25}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                opacity={0.1}
                horizontal={false}
              />
              <XAxis
                type="number"
                tickFormatter={(value) => `${Math.round(value * 100)}%`}
                domain={[0, 1]}
                hide={false}
                tick={{ fill: "#9ca3af", fontSize: 10 }}
              />
              <YAxis
                dataKey="name"
                type="category"
                tick={{ fill: "#d1d5db", fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={70}
              />
              <Tooltip
                content={CustomTooltip}
                cursor={{ fill: "rgba(110,118,145,0.1)" }}
                wrapperStyle={{ outline: "none" }}
              />
              <Legend
                height={14}
                iconSize={10}
                iconType="circle"
                verticalAlign="bottom"
                wrapperStyle={{ fontSize: 12, paddingTop: 2 }}
                payload={["protein", "carbs", "fats"].map((macro) => ({
                  id: macro,
                  value: macro.charAt(0).toUpperCase() + macro.slice(1),
                  type: "circle",
                  color: MACRO_COLORS[macro].base,
                }))}
                formatter={(value) => (
                  <span className="text-gray-300 capitalize ml-1">{value}</span>
                )}
              />
              <Bar
                dataKey="protein"
                stackId="1"
                fill={MACRO_COLORS.protein.gradient[0]}
                radius={[20, 0, 0, 20]}
              >
                <LabelList dataKey="protein" content={PercentageLabel} />
              </Bar>
              <Bar
                dataKey="carbs"
                stackId="1"
                fill={MACRO_COLORS.carbs.gradient[0]}
                radius={[0, 0, 0, 0]}
              >
                <LabelList dataKey="carbs" content={PercentageLabel} />
              </Bar>
              <Bar
                dataKey="fats"
                stackId="1"
                fill={MACRO_COLORS.fats.gradient[0]}
                radius={[0, 20, 20, 0]}
              >
                <LabelList dataKey="fats" content={PercentageLabel} />
              </Bar>{" "}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

interface CustomTooltipPayload {
  name: string;
  protein: number;
  carbs: number;
  fats: number;
  gProtein: string;
  gCarbs: string;
  gFats: string;
  calories: number;
}

const CustomTooltip = ({ active, payload }: TooltipProps<number, string>) => {
  if (!active || !payload || payload.length === 0) return;

  const data = payload[0].payload as CustomTooltipPayload;
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-md shadow-xl p-2 text-sm">
      <p className="font-medium text-white mb-1">{data.name}</p>
      <div className="space-y-0.5">
        <p className="text-green-400">
          <span className="inline-block w-3 h-3 rounded-full bg-green-400 mr-2" />
          <span className="font-medium">{data.protein}%</span>
          <span className="text-xs ml-1">({data.gProtein}g protein)</span>
        </p>
        <p className="text-blue-400">
          <span className="inline-block w-3 h-3 rounded-full bg-blue-400 mr-2" />
          <span className="font-medium">{data.carbs}%</span>
          <span className="text-xs ml-1">({data.gCarbs}g carbs)</span>
        </p>
        <p className="text-red-400">
          <span className="inline-block w-3 h-3 rounded-full bg-red-400 mr-2" />
          <span className="font-medium">{data.fats}%</span>
          <span className="text-xs ml-1">({data.gFats}g fats)</span>
        </p>
      </div>
      <p className="text-gray-300 text-xs mt-1 pt-1 border-t border-gray-700">
        {Math.round(data.calories)} calories
      </p>
    </div>
  );
};

export default NutrientDensityVisualization;
