import { useState } from "react";
import type { LabelProps, TooltipProps } from "recharts";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard, StatSelector } from "@/components/chart";
import { getUnitForStat, MEAL_COLORS } from "@/utils/chartColors";

import {
  formatMealType,
  MacroEntry,
  MealTypeDistributionData,
  useMealTimeBreakdown,
} from "../hooks/useMealTimeBreakdown";

interface MealTimeBreakdownProps {
  history: MacroEntry[];
  startDate: string; // ISO string 'YYYY-MM-DD'
  endDate: string; // ISO string 'YYYY-MM-DD'
}

function MealTimeBreakdown({
  history,
  startDate,
  endDate,
}: MealTimeBreakdownProps) {
  const [selectedStat, setSelectedStat] = useState<string>("calories");
  const mealTypeDistribution = useMealTimeBreakdown(
    history,
    startDate,
    endDate,
    selectedStat,
  );
  if (mealTypeDistribution.length === 0) {
    return (
      <ChartCard
        title="Meal Distribution"
        isEmpty={true}
        emptyMessage="No meal data available for selected period."
      >
        <div />
      </ChartCard>
    );
  }

  // Create gradient definitions
  const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
  const gradientDefs = (
    <defs>
      {MEAL_TYPES.map((mealType) => {
        const { gradient } = MEAL_COLORS[mealType];
        return (
          <linearGradient
            key={`color-${mealType}`}
            id={`color-${mealType}`}
            x1="1"
            y1="0"
            x2="0"
            y2="0"
          >
            <stop offset="0%" stopColor={gradient[0]} stopOpacity={0.8} />
            <stop offset="100%" stopColor={gradient[1]} stopOpacity={0.8} />
          </linearGradient>
        );
      })}
    </defs>
  );

  // Custom label renderer
  const renderPercentageLabel = (properties: LabelProps) => {
    const { x = 0, y = 0, width = 0, height = 0, value } = properties;
    const percent =
      typeof value === "number"
        ? value
        : Number.parseInt((value as string) || "0", 10);
    const widthNumber = typeof width === "number" ? width : Number(width);
    const xNumber = typeof x === "number" ? x : Number(x);
    const yNumber = typeof y === "number" ? y : Number(y);
    const heightNumber = typeof height === "number" ? height : Number(height);

    if (percent < 5 || widthNumber < 50) return;

    return (
      <text
        x={xNumber + widthNumber - 10}
        y={yNumber + heightNumber / 2}
        fill="#fff"
        fontSize={12}
        fontWeight="bold"
        textAnchor="end"
        dominantBaseline="central"
        style={{ opacity: 0.92 }}
      >
        {percent}%
      </text>
    );
  };
  return (
    <ChartCard
      title="Meal Distribution"
      className="h-[300px]"
      action={
        <StatSelector
          selectedStat={selectedStat}
          onStatChange={setSelectedStat}
          availableStats={["calories", "protein", "carbs", "fats", "count"]}
        />
      }
    >
      {" "}
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <BarChart
          layout="vertical"
          data={mealTypeDistribution}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
          barSize={25}
        >
          {gradientDefs}
          <CartesianGrid
            strokeDasharray="3 3"
            opacity={0.1}
            horizontal={false}
          />

          <XAxis
            type="number"
            domain={[0, "dataMax"]}
            tickFormatter={(value) =>
              `${Math.round(value)}${
                selectedStat === "count"
                  ? ""
                  : " " + getUnitForStat(selectedStat)
              }`
            }
            tick={{ fill: "#9ca3af", fontSize: 10 }}
          />

          <YAxis
            dataKey="name"
            type="category"
            tick={{ fill: "#d1d5db", fontSize: 12 }}
            axisLine={true}
            tickLine={true}
            width={70}
            interval={0}
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
            align="center"
            wrapperStyle={{ fontSize: 12, paddingTop: 2 }}
            payload={MEAL_TYPES.map((mealType) => ({
              id: mealType,
              value: formatMealType(mealType),
              type: "circle",
              color: MEAL_COLORS[mealType].base,
            }))}
            formatter={(value) => (
              <span className="text-gray-300 capitalize ml-1">{value}</span>
            )}
          />

          <Bar
            dataKey="value"
            name="Meal Distribution"
            fill="#8884d8"
            radius={[0, 20, 20, 0]}
            label={false}
          >
            {mealTypeDistribution.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={`url(#color-${MEAL_TYPES[index]})`}
              />
            ))}
            <LabelList
              dataKey="percentage"
              position="insideRight"
              content={renderPercentageLabel}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

const CustomTooltip = (
  properties: TooltipProps<number, string> & { selectedStat?: string },
) => {
  // selectedStat is passed via ...rest
  const { active, payload, selectedStat } = properties;
  if (!active || !payload?.length) return;

  const data = payload[0].payload as MealTypeDistributionData;
  const unit = getUnitForStat(selectedStat || "calories");

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-md shadow-xl p-2 text-sm">
      <p className="font-medium text-white">{data.name}</p>
      <p className="text-gray-300">
        <span className="font-medium">
          {selectedStat === "calories" ? "~" : ""}
          {data.value.toFixed(1)}
          {unit}
        </span>
        <span className="ml-1 text-gray-400">({data.percentage}%)</span>
      </p>
      {selectedStat !== "calories" && (
        <p className="text-gray-400 text-xs mt-1">
          ~ {data.calories.toFixed(0)} kcal
        </p>
      )}
      {selectedStat !== "count" && (
        <p className="text-gray-400 text-xs">
          {data.count} meal{data.count === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
};

export default MealTimeBreakdown;
