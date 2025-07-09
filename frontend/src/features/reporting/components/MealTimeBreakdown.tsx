import { useMemo, useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  LabelList,
  Cell,
  Legend,
} from "recharts";
import { ChartCard, StatSelector } from "@/components/chart";
import { MEAL_COLORS, getUnitForStat } from "@/utils/chart-colors";

// Define meal types and their display order
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = (typeof MEAL_TYPES)[number];

interface MealTimeBreakdownProps {
  history: MacroEntry[];
  startDate: string; // ISO string 'YYYY-MM-DD'
  endDate: string; // ISO string 'YYYY-MM-DD'
}

interface MacroEntry {
  id: number;
  protein: number;
  carbs: number;
  fats: number;
  mealType: MealType;
  mealName: string | null;
  entryDate?: string;
  entryTime?: string;
  createdAt: string;
}

const formatMealType = (mealType: string) =>
  mealType.charAt(0).toUpperCase() + mealType.slice(1);

const calculateCalories = (entry: any) =>
  entry.calories ??
  (entry.protein || 0) * 4 + (entry.carbs || 0) * 4 + (entry.fats || 0) * 9;

function calculateMealTypeDistribution(
  entries: MacroEntry[],
  selectedStat: string,
) {
  // Initialize groups
  const groups = Object.fromEntries(
    MEAL_TYPES.map((type) => [
      type,
      { calories: 0, protein: 0, carbs: 0, fats: 0, count: 0 },
    ]),
  );

  // Aggregate data by meal type
  entries.forEach((entry) => {
    const mealType = entry.mealType || "snack";
    const group = groups[mealType];

    group.protein += entry.protein || 0;
    group.carbs += entry.carbs || 0;
    group.fats += entry.fats || 0;
    group.calories += calculateCalories(entry);
    group.count += 1;
  });

  // Convert to averages for calories
  Object.values(groups).forEach((group) => {
    group.calories = group.count > 0 ? group.calories / group.count : 0;
  });

  // Calculate totals for percentages
  const totals = Object.values(groups).reduce(
    (acc, group) => ({
      calories: acc.calories + group.calories,
      protein: acc.protein + group.protein,
      carbs: acc.carbs + group.carbs,
      fats: acc.fats + group.fats,
      count: acc.count + group.count,
    }),
    { calories: 0, protein: 0, carbs: 0, fats: 0, count: 0 },
  );

  // Format for chart
  return MEAL_TYPES.map((mealType) => {
    const group = groups[mealType];
    const value = group[selectedStat as keyof typeof group];
    const total = totals[selectedStat as keyof typeof totals];
    const percentage = total > 0 ? Math.round((value / total) * 100) : 0;

    return {
      name: formatMealType(mealType),
      ...group,
      value,
      percentage,
    };
  });
}

function MealTimeBreakdown({
  history,
  startDate,
  endDate,
}: MealTimeBreakdownProps) {
  const [selectedStat, setSelectedStat] = useState<string>("calories");
  // Filter history by date range
  const filteredHistory = useMemo(() => {
    if (!history?.length) return [];

    const start = new Date(startDate);
    const end = new Date(endDate);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    return history.filter((entry) => {
      const dateStr = entry.entryDate || entry.createdAt?.split("T")[0];
      if (!dateStr) return false;

      const entryDate = new Date(dateStr);
      entryDate.setHours(12, 0, 0, 0);
      return entryDate >= start && entryDate <= end;
    });
  }, [history, startDate, endDate]);

  const mealTypeDistribution = useMemo(
    () =>
      filteredHistory.length
        ? calculateMealTypeDistribution(filteredHistory, selectedStat)
        : [],
    [filteredHistory, selectedStat],
  );
  if (!filteredHistory.length) {
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
  const renderPercentageLabel = (props: any) => {
    const { x = 0, y = 0, width = 0, height = 0, value } = props;
    const percent =
      typeof value === "number" ? value : parseInt(value || "0", 10);

    if (percent < 5 || width < 50) return null;

    return (
      <text
        x={x + width - 10}
        y={y + height / 2}
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

const CustomTooltip = ({ active, payload, selectedStat }: any) => {
  if (!active || !payload?.length) return null;

  const data = payload[0].payload;
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
          {data.count} meal{data.count !== 1 ? "s" : ""}
        </p>
      )}
    </div>
  );
};

export default MealTimeBreakdown;
