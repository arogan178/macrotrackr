import { useMemo, useState } from "react";
import {
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
} from "recharts";

import { AnimatedNumber } from "@/components/animation";
import { ChartCard } from "@/components/chart";
import TabBar from "@/components/ui/TabBar";
import { getUnitForStat, MEAL_COLORS } from "@/utils/chartColors";

import {
  MacroEntry,
  useMealTimeBreakdown,
} from "../hooks/useMealTimeBreakdown";

interface MealTimeBreakdownProps {
  history: MacroEntry[];
  startDate: string; // ISO string 'YYYY-MM-DD'
  endDate: string; // ISO string 'YYYY-MM-DD'
}

// Custom tooltip for Donut chart
const CustomDonutTooltip = ({ active, payload, selectedStat }: any) => {
  if (active && payload && payload.length > 0) {
    const data = payload[0].payload;
    const value = data.value;
    const unit =
      selectedStat === "count" ? " meals" : ` ${getUnitForStat(selectedStat)}`;
    const color = payload[0].payload.fill || payload[0].color;

    return (
      <div className="rounded-lg border border-border/50 bg-surface-2 p-3 shadow-xl">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: color }}
          />
          <p className="font-semibold text-foreground">{data.name}</p>
        </div>
        <div className="mt-2 flex flex-col gap-1">
          <p className="text-sm text-muted">
            <span className="font-medium text-foreground">
              {Math.round(value)}
            </span>
            {unit}
          </p>
          <p className="text-xs text-muted/80">
            {data.percentage}% of daily total
          </p>
        </div>
      </div>
    );
  }
  return null;
};

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

  // Calculate total for center of donut
  const totalValue = useMemo(() => {
    return mealTypeDistribution.reduce(
      (accumulator, current) => accumulator + current.value,
      0,
    );
  }, [mealTypeDistribution]);

  // Build TabBar items
  const tabItems = useMemo(
    () => [
      { key: "calories", label: "Calories" },
      { key: "protein", label: "Protein" },
      { key: "carbs", label: "Carbs" },
      { key: "fats", label: "Fats" },
      { key: "count", label: "Count" },
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
            size="sm"
            isMotion
            layoutId="meal-distribution-tab-empty"
          />
        }
      >
        <div />
      </ChartCard>
    );
  }

  // Define MEAL_TYPES matching the hook logic for consistent colors
  const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;

  return (
    <ChartCard
      title="Meal Distribution"
      className="w-full"
      action={
        <TabBar
          items={tabItems}
          activeKey={selectedStat}
          onChange={setSelectedStat}
          size="sm"
          isMotion
          layoutId="meal-distribution-tab"
        />
      }
    >
      <ResponsiveContainer width="100%" height="100%" minHeight={300}>
        <PieChart margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
          <Pie
            data={mealTypeDistribution}
            cx="50%"
            cy="50%"
            innerRadius={85}
            outerRadius={115}
            paddingAngle={3}
            dataKey="value"
            stroke="none"
            isAnimationActive={true}
            animationDuration={500}
            animationEasing="ease-out"
          >
            {mealTypeDistribution.map((entry, index) => {
              // Ensure we map back to the key for colors
              const typeKey =
                entry.name.toLowerCase() as (typeof MEAL_TYPES)[number];
              const color = MEAL_COLORS[typeKey]?.base || "#8884d8";
              return <Cell key={`cell-${index}`} fill={color} />;
            })}
          </Pie>

          {/* Center Text - account for Legend height at bottom */}
          <foreignObject
            x="0"
            y="0"
            width="100%"
            height="calc(100% - 36px)"
            className="pointer-events-none"
          >
            <div className="flex h-full items-center justify-center">
              <div className="flex flex-col items-center gap-0.5">
                <div className="text-3xl font-bold tracking-tight text-foreground">
                  <AnimatedNumber value={totalValue} toFixedValue={0} duration={0.5} />
                </div>
                <div className="text-xs font-medium tracking-wider text-muted uppercase">
                  {selectedStat === "count" ? "Total Meals" : "Avg / Day"}
                </div>
                {selectedStat !== "count" && (
                  <div className="text-[10px] text-muted/60 uppercase">
                    {getUnitForStat(selectedStat)}
                  </div>
                )}
              </div>
            </div>
          </foreignObject>

          <RechartsTooltip
            content={<CustomDonutTooltip selectedStat={selectedStat} />}
            cursor={{ fill: "transparent" }}
          />

          <Legend
            verticalAlign="bottom"
            height={36}
            iconType="circle"
            formatter={(value) => (
              <span className="ml-1 text-sm font-medium text-foreground">
                {value}
              </span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </ChartCard>
  );
}

export default MealTimeBreakdown;
