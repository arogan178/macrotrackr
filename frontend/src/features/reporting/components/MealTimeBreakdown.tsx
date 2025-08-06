import { useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  Legend,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  type TooltipProps,
  XAxis,
  YAxis,
} from "recharts";

import { ChartCard } from "@/components/chart";
import {
  legendFormatter,
  PercentageLabel,
  standardLegendConfig,
} from "@/components/chart/ChartUtilities";
import TabBar from "@/components/ui/TabBar";
import { getUnitForStat, MEAL_COLORS, STAT_COLORS } from "@/utils/chartColors";

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
  // Build TabBar items for stat selection (must be before any early return)
  const tabItems = useMemo(
    () => [
      { key: "calories", label: "Calories", activeBg: STAT_COLORS.calories },
      { key: "protein", label: "Protein", activeBg: STAT_COLORS.protein },
      { key: "carbs", label: "Carbs", activeBg: STAT_COLORS.carbs },
      { key: "fats", label: "Fats", activeBg: STAT_COLORS.fats },
      { key: "count", label: "Count", activeBg: STAT_COLORS.count },
    ],
    [],
  );

  if (mealTypeDistribution.length === 0) {
    return (
      <ChartCard
        title="Meal Distribution"
        isEmpty={true}
        emptyMessage="No meal data available for selected period."
        action={
          <TabBar
            items={tabItems}
            activeKey={selectedStat}
            onChange={setSelectedStat}
            rounded="rounded-lg"
            isMotion
            layoutId="statHighlight"
            size="xs"
            className="p-0.5 [&_button]:px-2.5 [&_button]:py-0.5 [&_button]:text-xs"
          />
        }
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

  return (
    <ChartCard
      title="Meal Distribution"
      className="h-[300px]"
      action={
        <TabBar
          items={tabItems}
          activeKey={selectedStat}
          onChange={setSelectedStat}
          rounded="rounded-lg"
          isMotion
          layoutId="statHighlight"
          size="xs"
          className="p-0.5 [&_button]:px-2.5 [&_button]:py-0.5 [&_button]:text-xs"
        />
      }
    >
      {" "}
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <BarChart
          layout="vertical"
          data={mealTypeDistribution}
          margin={{ top: 10, right: 30, left: 0, bottom: 10 }}
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

          <RechartsTooltip
            content={CustomTooltip}
            cursor={{ fill: "rgba(110,118,145,0.1)" }}
            wrapperStyle={{ outline: "none" }}
          />

          <Legend
            {...standardLegendConfig}
            payload={MEAL_TYPES.map((mealType) => ({
              id: mealType,
              value: formatMealType(mealType),
              type: "circle",
              color: MEAL_COLORS[mealType].base,
            }))}
            formatter={legendFormatter}
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
              content={(properties) => (
                // Recharts passes a large object; we map to the minimal props our component expects
                <PercentageLabel
                  x={(properties as any).x}
                  y={(properties as any).y}
                  width={(properties as any).width}
                  height={(properties as any).height}
                  value={(properties as any).value as number}
                />
              )}
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
    <div className="rounded-md border border-border bg-surface p-2 text-sm shadow-modal">
      <p className="font-medium text-foreground">{data.name}</p>
      <p className="text-foreground">
        <span className="font-medium">
          {selectedStat === "calories" ? "~" : ""}
          {data.value.toFixed(1)}
          {unit}
        </span>
        <span className="ml-1 text-foreground">({data.percentage}%)</span>
      </p>
      {selectedStat !== "calories" && (
        <p className="mt-1 text-xs text-foreground">
          ~ {data.calories.toFixed(0)} kcal
        </p>
      )}
      {selectedStat !== "count" && (
        <p className="text-xs text-foreground">
          {data.count} meal{data.count === 1 ? "" : "s"}
        </p>
      )}
    </div>
  );
};

export default MealTimeBreakdown;
