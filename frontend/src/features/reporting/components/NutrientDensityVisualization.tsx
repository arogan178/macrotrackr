import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
  LabelList,
} from "recharts";
import { motion } from "motion/react";
import { DefaultTooltip } from "@/components/chart/chart-helpers";
import { useStore } from "@/store/store";

// Enhanced colors with gradient definitions
const COLORS = {
  protein: {
    base: "#34d399", // green-400
    gradient: ["#10b981", "#34d399"] as [string, string],
    light: "#d1fae5", // green-100
  },
  carbs: {
    base: "#60a5fa", // blue-400
    gradient: ["#3b82f6", "#60a5fa"] as [string, string],
    light: "#dbeafe", // blue-100
  },
  fats: {
    base: "#f87171", // red-400
    gradient: ["#ef4444", "#f87171"] as [string, string],
    light: "#fee2e2", // red-100
  },
  background: {
    gradient: ["rgba(17, 24, 39, 0.8)", "rgba(31, 41, 55, 0.7)"] as [
      string,
      string
    ],
  },
};

interface NutrientDensityVisualizationProps {
  data: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }[];
}

type MacroType = "protein" | "carbs" | "fats";

// --- Helper Functions ---

function getMacroPercentages(
  entry: NutrientDensityVisualizationProps["data"][0]
) {
  const { protein, carbs, fats, calories } = entry;
  if (!calories || calories === 0)
    return { proteinPct: 0, carbsPct: 0, fatsPct: 0 };
  // 1g protein = 4 kcal, 1g carb = 4 kcal, 1g fat = 9 kcal
  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatsCals = fats * 9;
  const totalMacroCals = proteinCals + carbsCals + fatsCals; // Use sum of macros for percentage calculation if preferred

  // Calculate based on total calories or total macro calories
  const divisor = totalMacroCals > 0 ? totalMacroCals : calories;
  if (divisor === 0) return { proteinPct: 0, carbsPct: 0, fatsPct: 0 };

  return {
    proteinPct: Math.round((proteinCals / divisor) * 100),
    carbsPct: Math.round((carbsCals / divisor) * 100),
    fatsPct: Math.round((fatsCals / divisor) * 100),
  };
}

function calculateWeeklyAverage(
  data: NutrientDensityVisualizationProps["data"]
) {
  if (!data.length) return null;

  const totalMacros = data.reduce(
    (acc, entry) => {
      acc.protein += entry.protein;
      acc.carbs += entry.carbs;
      acc.fats += entry.fats;
      acc.calories += entry.calories;
      return acc;
    },
    { protein: 0, carbs: 0, fats: 0, calories: 0 }
  );

  const numDays = data.length;
  const avgEntry = {
    name: "Weekly Avg",
    protein: totalMacros.protein / numDays,
    carbs: totalMacros.carbs / numDays,
    fats: totalMacros.fats / numDays,
    calories: totalMacros.calories / numDays,
  };

  const { proteinPct, carbsPct, fatsPct } = getMacroPercentages(avgEntry);

  return {
    name: "Weekly Avg",
    protein: proteinPct,
    carbs: carbsPct,
    fats: fatsPct,
    gProtein: avgEntry.protein.toFixed(1),
    gCarbs: avgEntry.carbs.toFixed(1),
    gFats: avgEntry.fats.toFixed(1),
    calories: Math.round(avgEntry.calories),
  };
}

// --- Subcomponents ---

interface PercentageLabelProps {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  value?: number;
}

const PercentageLabel = React.memo((props: PercentageLabelProps) => {
  const { x = 0, y = 0, width = 0, height = 0, value = 0 } = props;
  // Only show label if value is significant enough to fit
  if (value < 5 || width < 20) return null;
  return (
    <text
      x={x + width / 2} // Center label horizontally
      y={y + height / 2}
      fill="#ffffff"
      fontSize={9} // Slightly smaller font size
      textAnchor="middle" // Center text
      dominantBaseline="central"
      fontWeight={600}
    >
      {`${value}%`}
    </text>
  );
});

// --- Main Component ---

function NutrientDensityVisualization({
  data,
}: NutrientDensityVisualizationProps) {
  const macroTarget = useStore((state) => state.macroTarget);
  // Set a fixed chart height for consistency across all ranges
  const chartHeight = 220;

  const TARGET_MACROS = useMemo(
    () =>
      macroTarget || {
        proteinPercentage: 30,
        carbsPercentage: 40,
        fatsPercentage: 30,
      },
    [macroTarget]
  );

  const chartData = useMemo(() => {
    const lastWeekData = data.slice(-7);
    return lastWeekData
      .map((entry) => {
        const { proteinPct, carbsPct, fatsPct } = getMacroPercentages(entry);
        const hasNoMacros =
          entry.protein === 0 && entry.carbs === 0 && entry.fats === 0;

        return {
          name: entry.name.substring(0, 6), // Abbreviate name (e.g., Apr 18)
          protein: hasNoMacros ? 0 : proteinPct,
          carbs: hasNoMacros ? 0 : carbsPct,
          fats: hasNoMacros ? 0 : fatsPct,
          emptyBar: hasNoMacros ? 100 : 0, // Add empty bar for days with no macros
          gProtein: entry.protein.toFixed(1),
          gCarbs: entry.carbs.toFixed(1),
          gFats: entry.fats.toFixed(1),
          calories: entry.calories,
          hasNoMacros, // Flag for empty days
        };
      })
      .reverse(); // Show most recent day at the bottom
  }, [data]);

  const macroSummary = useMemo(() => {
    if (!data.length) return null;
    const lastDayEntry = data[data.length - 1];
    if (!lastDayEntry) return null;
    const { proteinPct, carbsPct, fatsPct } = getMacroPercentages(lastDayEntry);
    return {
      protein: proteinPct,
      carbs: carbsPct,
      fats: fatsPct,
      gProtein: lastDayEntry.protein.toFixed(1),
      gCarbs: lastDayEntry.carbs.toFixed(1),
      gFats: lastDayEntry.fats.toFixed(1),
    };
  }, [data]);

  const weeklyAvg = useMemo(() => {
    const lastWeekData = data.slice(-7);
    return calculateWeeklyAverage(lastWeekData);
  }, [data]);

  // Calculate total percentages for divider width calculation
  const totalDailyPercent = macroSummary
    ? macroSummary.protein + macroSummary.carbs + macroSummary.fats
    : 100;
  const proteinWidth = macroSummary
    ? (macroSummary.protein / totalDailyPercent) * 100
    : 33.3;
  const carbsWidth = macroSummary
    ? (macroSummary.carbs / totalDailyPercent) * 100
    : 33.3;
  const fatsWidth = macroSummary
    ? (macroSummary.fats / totalDailyPercent) * 100
    : 33.3;

  return (
    <motion.div
      layout
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4 }}
      className="bg-gray-800/70 rounded-xl border border-gray-700/30 p-3 shadow-lg h-full flex flex-col"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-baseline gap-1.5">
          <h3 className="text-base font-semibold text-white">
            Nutrient Density
          </h3>
          <span className="text-sm text-gray-400 truncate max-w-[120px] block">
            Last {data.length} Days
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 min-h-[150px]">
        <ResponsiveContainer width="100%" height={chartHeight} minHeight={150}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 0, right: 15, left: 0, bottom: 16 }} // Adjusted margins
            barCategoryGap="25%" // Adjusted gap
            barSize={10} // Adjusted bar size
          >
            <defs>
              {Object.entries(COLORS).map(([key, color]) => {
                if (key === "background" || !Array.isArray(color.gradient))
                  return null;
                const gradientKey = `color${key}`;
                return (
                  <linearGradient
                    key={gradientKey}
                    id={gradientKey}
                    x1="0"
                    y1="0"
                    x2="1"
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
                      stopOpacity={0.9}
                    />
                  </linearGradient>
                );
              })}
            </defs>
            <CartesianGrid
              strokeDasharray="2 4"
              stroke="rgba(75,85,99,0.1)" // Lighter grid
              horizontal={false}
            />
            <XAxis
              type="number"
              domain={[0, 100]}
              tick={{ fill: "#9ca3af", fontSize: 10 }} // Adjusted tick style
              axisLine={false} // Hide axis line
              tickLine={false}
              tickFormatter={(v) => `${v}%`}
              interval="preserveStartEnd"
              tickCount={5}
            />{" "}
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: "#d1d5db", fontSize: 12 }} // Adjusted tick style
              axisLine={false}
              tickLine={false}
              width={60} // Increased width to prevent clipping
              interval={0} // Show all ticks
            />
            <Tooltip
              content={<DefaultTooltip />}
              cursor={{ fill: "rgba(110,118,145,0.1)" }}
              wrapperStyle={{ outline: "none" }}
              formatter={(
                value: number,
                name: string,
                props: {
                  payload?: {
                    gProtein?: string;
                    gCarbs?: string;
                    gFats?: string;
                  };
                }
              ) => {
                const item = props.payload;
                if (item) {
                  const gramValue =
                    name === "Protein" // Match Bar name prop
                      ? item.gProtein
                      : name === "Carbs"
                      ? item.gCarbs
                      : name === "Fats"
                      ? item.gFats
                      : "N/A";
                  return [`${gramValue}g (${value}%)`, name];
                }
                return [`${value}%`, name];
              }}
            />
            <Legend
              iconType="circle"
              iconSize={6}
              verticalAlign="bottom"
              align="center"
              height={14}
              wrapperStyle={{
                fontSize: "10px",
                paddingTop: 4, // Reduced padding
                paddingBottom: 0,
              }}
              formatter={(value) => (
                <span className="text-gray-300 capitalize ml-1">{value}</span>
              )}
            />
            {/* Reference lines removed for cleaner look, can be added back if needed */}
            <Bar
              dataKey="protein"
              stackId="a"
              fill={`url(#colorprotein)`}
              radius={[2, 0, 0, 2]} // Smaller radius
              name="Protein"
              animationDuration={1000} // Faster animation
            >
              <LabelList content={<PercentageLabel />} dataKey="protein" />
            </Bar>
            <Bar
              dataKey="carbs"
              stackId="a"
              fill={`url(#colorcarbs)`}
              radius={0}
              name="Carbs"
              animationDuration={1000}
              animationBegin={50}
            >
              <LabelList content={<PercentageLabel />} dataKey="carbs" />
            </Bar>
            <Bar
              dataKey="fats"
              stackId="a"
              fill={`url(#colorfats)`}
              radius={[0, 2, 2, 0]} // Smaller radius
              name="Fats"
              animationDuration={1000}
              animationBegin={100}
            >
              <LabelList content={<PercentageLabel />} dataKey="fats" />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

export default React.memo(NutrientDensityVisualization);
