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
import { motion } from "motion/react"; // Ensure motion is imported

// Define meal types and their display order
const MEAL_TYPES = ["breakfast", "lunch", "dinner", "snack"] as const;
type MealType = (typeof MEAL_TYPES)[number];

// Colors for different meal types with gradients
const MEAL_COLORS = {
  breakfast: {
    base: "#60a5fa", // blue-400
    gradient: ["#3b82f6", "#60a5fa"] as [string, string],
  },
  lunch: {
    base: "#34d399", // green-400
    gradient: ["#10b981", "#34d399"] as [string, string],
  },
  dinner: {
    base: "#f87171", // red-400
    gradient: ["#ef4444", "#f87171"] as [string, string],
  },
  snack: {
    base: "#a78bfa", // purple-400
    gradient: ["#8b5cf6", "#a78bfa"] as [string, string],
  },
};

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
  entry_date: string;
  entry_time: string;
  created_at: string;
}

// Format to nicely capitalize words
const formatMealType = (mealType: string): string => {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
};

function calculateMealTypeDistribution(
  entries: MacroEntry[],
  selectedStat: string
): any[] {
  // Group entries by meal type
  const mealTypeGroups: Record<
    string,
    {
      calories: number;
      protein: number;
      carbs: number;
      fats: number;
      count: number;
    }
  > = {};

  // Initialize meal type groups
  MEAL_TYPES.forEach((mealType) => {
    mealTypeGroups[mealType] = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fats: 0,
      count: 0,
    };
  });

  // Sum up macros for each meal type
  entries.forEach((entry: any) => {
    // Accepts both MacroEntry and aggregatedData shape
    // If entry has mealType, use it; otherwise, fallback to 'snack'
    const mealType = entry.mealType || "snack";
    // If entry has calories, use it; otherwise, calculate
    const calories =
      typeof entry.calories === "number"
        ? entry.calories
        : (entry.protein || 0) * 4 +
          (entry.carbs || 0) * 4 +
          (entry.fats || 0) * 9;

    mealTypeGroups[mealType].protein += entry.protein || 0;
    mealTypeGroups[mealType].carbs += entry.carbs || 0;
    mealTypeGroups[mealType].fats += entry.fats || 0;
    mealTypeGroups[mealType].calories += calories;
    mealTypeGroups[mealType].count += 1;
  });

  // After summing, convert total calories to average calories per meal type
  MEAL_TYPES.forEach((mealType) => {
    const group = mealTypeGroups[mealType];
    if (group.count > 0) {
      group.calories = group.calories / group.count;
    } else {
      group.calories = 0;
    }
  });

  // Calculate total for percentages
  const totals = {
    calories: Object.values(mealTypeGroups).reduce(
      (sum, group) => sum + group.calories,
      0
    ),
    protein: Object.values(mealTypeGroups).reduce(
      (sum, group) => sum + group.protein,
      0
    ),
    carbs: Object.values(mealTypeGroups).reduce(
      (sum, group) => sum + group.carbs,
      0
    ),
    fats: Object.values(mealTypeGroups).reduce(
      (sum, group) => sum + group.fats,
      0
    ),
    count: Object.values(mealTypeGroups).reduce(
      (sum, group) => sum + group.count,
      0
    ),
  };

  // Format for chart display
  return MEAL_TYPES.map((mealType) => {
    const group = mealTypeGroups[mealType];
    const percentages = {
      caloriesPercent:
        totals.calories > 0
          ? Math.round((group.calories / totals.calories) * 100)
          : 0,
      proteinPercent:
        totals.protein > 0
          ? Math.round((group.protein / totals.protein) * 100)
          : 0,
      carbsPercent:
        totals.carbs > 0 ? Math.round((group.carbs / totals.carbs) * 100) : 0,
      fatsPercent:
        totals.fats > 0 ? Math.round((group.fats / totals.fats) * 100) : 0,
      countPercent:
        totals.count > 0 ? Math.round((group.count / totals.count) * 100) : 0,
    };

    return {
      name: formatMealType(mealType),
      calories: group.calories,
      protein: group.protein,
      carbs: group.carbs,
      fats: group.fats,
      count: group.count,
      caloriesPercent: percentages.caloriesPercent,
      proteinPercent: percentages.proteinPercent,
      carbsPercent: percentages.carbsPercent,
      fatsPercent: percentages.fatsPercent,
      countPercent: percentages.countPercent,
      // Add display value based on selected stat
      value:
        selectedStat === "calories"
          ? group.calories
          : selectedStat === "protein"
          ? group.protein
          : selectedStat === "carbs"
          ? group.carbs
          : selectedStat === "fats"
          ? group.fats
          : group.count,
      percentage:
        selectedStat === "calories"
          ? percentages.caloriesPercent
          : selectedStat === "protein"
          ? percentages.proteinPercent
          : selectedStat === "carbs"
          ? percentages.carbsPercent
          : selectedStat === "fats"
          ? percentages.fatsPercent
          : percentages.countPercent,
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
    if (!history || history.length === 0) return [];

    // Create date objects with timezone handling
    const start = new Date(startDate);
    start.setHours(0, 0, 0, 0); // Set to start of day

    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999); // Set to end of day

    return history.filter((entry) => {
      // First try to get the date from entry_date, then fall back to created_at if needed
      const dateStr =
        entry.entry_date ||
        (entry.created_at ? entry.created_at.split("T")[0] : null);

      if (!dateStr) return false;

      // Create a date object that's consistent with our date range objects
      const entryDate = new Date(dateStr);
      entryDate.setHours(12, 0, 0, 0); // Set to noon to avoid timezone issues

      return entryDate >= start && entryDate <= end;
    });
  }, [history, startDate, endDate]);

  // Data processing: use the filtered meal-level history
  const mealTypeDistribution = useMemo(() => {
    if (!filteredHistory || filteredHistory.length === 0) {
      return [];
    }
    return calculateMealTypeDistribution(filteredHistory, selectedStat);
  }, [filteredHistory, selectedStat]);

  // Get the unit suffix based on the selected stat
  const getUnit = () => {
    switch (selectedStat) {
      case "calories":
        return "kcal";
      case "protein":
      case "carbs":
      case "fats":
        return "g";
      default:
        return "";
    }
  };

  if (!filteredHistory || filteredHistory.length === 0) {
    return (
      <div className="bg-gray-800/70 rounded-xl border border-gray-700/50 p-5 h-64 flex items-center justify-center">
        <div className="text-gray-400">No meal data for selected period.</div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-gray-800/70 rounded-xl border border-gray-700/30 p-3 shadow-lg h-full flex flex-col"
    >
      {/* Header with title and stat selector */}{" "}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-semibold text-white">
          Meal Distribution
        </h3>
        <div className="relative flex flex-wrap space-x-1 p-0.5 bg-gray-700/60 rounded-lg">
          {["calories", "protein", "carbs", "fats", "count"].map((stat) => {
            // Map stat to appropriate color
            let bgColor = "bg-indigo-600"; // Default for calories
            if (stat === "protein") bgColor = "bg-green-600";
            if (stat === "carbs") bgColor = "bg-blue-600";
            if (stat === "fats") bgColor = "bg-red-600";
            if (stat === "count") bgColor = "bg-purple-600";

            return (
              <button
                key={stat}
                onClick={() => setSelectedStat(stat)}
                className={`relative px-2 py-0.5 rounded text-xs font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-1 focus-visible:ring-white/50 ${
                  selectedStat === stat
                    ? "text-white"
                    : "text-gray-300 hover:bg-gray-600/50 hover:text-white"
                }`}
              >
                <span className="relative z-10">
                  {stat.charAt(0).toUpperCase() + stat.slice(1)}
                </span>
                {selectedStat === stat && (
                  <motion.div
                    className={`absolute inset-0 rounded shadow-md ${bgColor}`}
                    layoutId="mealStatHighlight"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
      {/* Main content */}
      <div className="flex-1">
        {mealTypeDistribution.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%" minHeight={150}>
            <BarChart
              layout="vertical"
              data={mealTypeDistribution}
              margin={{
                top: 5,
                right: 30,
                left: 0,
                bottom: 5,
              }}
              barSize={20}
            >
              <defs>
                {MEAL_TYPES.map((mealType) => {
                  const color = MEAL_COLORS[mealType];
                  return (
                    <linearGradient
                      key={`color-${mealType}`}
                      id={`color-${mealType}`}
                      x1="1"
                      y1="0"
                      x2="0"
                      y2="0"
                    >
                      <stop
                        offset="0%"
                        stopColor={color.gradient[0]}
                        stopOpacity={0.8}
                      />
                      <stop
                        offset="100%"
                        stopColor={color.gradient[1]}
                        stopOpacity={0.8}
                      />
                    </linearGradient>
                  );
                })}
              </defs>
              <CartesianGrid
                strokeDasharray="5 5"
                opacity={0.1}
                horizontal={true}
                vertical={false}
              />
              <XAxis
                type="number"
                domain={[0, "dataMax"]}
                tickFormatter={(value) =>
                  `${Math.round(value)}${
                    selectedStat === "count" ? "" : " " + getUnit()
                  }`
                }
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
                content={(props) => CustomTooltip({ ...props, selectedStat })}
                cursor={{ fill: "rgba(110,118,145,0.1)" }}
                wrapperStyle={{ outline: "none" }}
              />
              <Legend
                height={14}
                iconSize={10}
                iconType="circle"
                verticalAlign="bottom"
                align="center"
                wrapperStyle={{
                  fontSize: 12,
                  paddingTop: 2,
                }}
                payload={MEAL_TYPES.map((mealType) => ({
                  id: mealType,
                  value: formatMealType(mealType),
                  type: "circle",
                  color: MEAL_COLORS[mealType].base,
                }))}
                formatter={(value) => (
                  <span className="text-gray-300 capitalize ml-1">{value}</span>
                )}
              />{" "}
              <Bar
                dataKey="value"
                name="Meal Distribution"
                fill="#8884d8"
                radius={[0, 10, 10, 0]}
                label={false}
              >
                {" "}
                {mealTypeDistribution.map((_, index) => {
                  const mealType = MEAL_TYPES[index];
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={`url(#color-${mealType})`}
                    />
                  );
                })}
                <LabelList
                  dataKey="percentage"
                  position="insideRight"
                  content={(props) => {
                    const { x, y, width, value, height } = props;
                    const xPos = typeof x === "number" ? x : 0;
                    const yPos = typeof y === "number" ? y : 0;
                    const widthVal = typeof width === "number" ? width : 0;
                    const heightVal = typeof height === "number" ? height : 0;
                    const percent =
                      typeof value === "number"
                        ? value
                        : parseInt(value || "0", 10);
                    return (
                      <text
                        x={xPos + widthVal - 10}
                        y={yPos + heightVal / 2}
                        fill="#fff"
                        fontSize={12}
                        fontWeight="bold"
                        textAnchor="end"
                        dominantBaseline="central"
                        style={{ opacity: percent > 0 ? 0.92 : 0 }}
                      >
                        {percent}%
                      </text>
                    );
                  }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-full flex items-center justify-center">
            <div className="text-gray-400 text-center">
              <p>No meal data available</p>
              <p className="text-sm mt-1">
                Add entries with meal types to see your distribution
              </p>
            </div>
          </div>
        )}{" "}
      </div>
    </motion.div>
  );
}

// Custom tooltip component
const CustomTooltip = ({ active, payload, selectedStat }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const unit =
      selectedStat === "calories"
        ? "kcal"
        : selectedStat === "count"
        ? ""
        : "g";

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
  }

  return null;
};

export default MealTimeBreakdown;
