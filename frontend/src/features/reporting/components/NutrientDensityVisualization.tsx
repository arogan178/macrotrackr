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

// Simplified COLORS object
const COLORS = {
  protein: {
    base: "#34d399", // green-400
    gradient: ["#10b981", "#34d399"] as [string, string],
  },
  carbs: {
    base: "#60a5fa", // blue-400
    gradient: ["#3b82f6", "#60a5fa"] as [string, string],
  },
  fats: {
    base: "#f87171", // red-400
    gradient: ["#ef4444", "#f87171"] as [string, string],
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
  selectedRange: 7 | 30 | 90; // Added prop for selected date range
}

// --- Helper Functions ---

function getMacroPercentages(
  entry: NutrientDensityVisualizationProps["data"][0]
) {
  const { protein, carbs, fats, calories } = entry;

  // If total calories from entry is 0, all percentages are 0
  if (calories === 0) {
    return { proteinPct: 0, carbsPct: 0, fatsPct: 0 };
  }

  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatsCals = fats * 9;
  const totalMacroCals = proteinCals + carbsCals + fatsCals;

  // If the sum of calories from macros is 0, all macro percentages are 0
  // (even if total 'calories' field has a value, e.g. from alcohol or data error)
  if (totalMacroCals === 0) {
    return { proteinPct: 0, carbsPct: 0, fatsPct: 0 };
  }

  // Calculate exact percentages based on total calories from macros
  const proteinPctExact = (proteinCals / totalMacroCals) * 100;
  const carbsPctExact = (carbsCals / totalMacroCals) * 100;
  // Fats percentage is also calculated for reference but will be adjusted

  let pOut = Math.round(proteinPctExact);
  let cOut = Math.round(carbsPctExact);

  // Fats takes the remainder to ensure the sum is 100
  let fOut = 100 - pOut - cOut;

  // If fOut becomes negative, it means pOut + cOut rounded up to > 100.
  // We need to adjust pOut and cOut downwards.
  if (fOut < 0) {
    fOut = 0; // Fats cannot be negative
    const excessSum = pOut + cOut - 100; // How much pOut + cOut is over 100

    // Reduce pOut and cOut. A simple way is to reduce the larger one first,
    // or reduce them proportionally.
    // Reducing proportionally to their current values:
    if (pOut + cOut > 0) {
      // Avoid division by zero
      const pReduction = Math.round(excessSum * (pOut / (pOut + cOut)));
      const cReduction = excessSum - pReduction;

      pOut -= pReduction;
      cOut -= cReduction;
    } else {
      // This case (pOut + cOut = 0 but their sum was > 100) is paradoxical and
      // implies an issue or extreme rounding from very small numbers.
      // Fallback: if pOut and cOut were 0, but created an overflow, set them to sum to 100.
      pOut = 50; // Or some other distribution
      cOut = 50;
    }
    // Ensure pOut and cOut are not negative after adjustment
    pOut = Math.max(0, pOut);
    cOut = Math.max(0, cOut);

    // Recalculate fOut as it must be 0 if pOut + cOut was >= 100
    fOut = 100 - pOut - cOut;
  }

  // Final guard to ensure all are non-negative and sum to 100.
  // This handles any minor discrepancies or edge cases from the adjustments.
  pOut = Math.max(0, pOut);
  cOut = Math.max(0, cOut);
  fOut = Math.max(0, fOut); // fOut might have been adjusted above

  const finalSum = pOut + cOut + fOut;
  if (finalSum !== 100 && totalMacroCals > 0) {
    // If sum is off, adjust the largest component or just one deterministically (e.g. fats)
    fOut += 100 - finalSum;
  }

  // One last clamp for fOut if the adjustment made it negative (highly unlikely here)
  fOut = Math.max(0, fOut);
  // And ensure sum is 100 by setting one as remainder if previous adjustment failed
  const checkSum = pOut + cOut + fOut;
  if (checkSum !== 100) {
    fOut = 100 - pOut - cOut;
  }

  return {
    proteinPct: pOut,
    carbsPct: cOut,
    fatsPct: Math.max(0, fOut), // Final safety clamp for fats
  };
}

// --- New Helper Functions for Date Display ---

// Format date entry name based on selected range
function formatDateName(
  entry: { name: string },
  _index: number, // Renamed to indicate it's unused
  selectedRange: number,
  _totalEntries: number // Renamed to indicate it's unused
): string {
  // For 7 days, keep daily format but ensure it's short
  if (selectedRange <= 7) {
    return entry.name.substring(0, 6); // e.g., "Apr 18"
  }

  // For 30 days, group into weeks based on actual calendar dates
  else if (selectedRange <= 30) {
    // Parse the date from the entry name
    const parts = entry.name.split(" ");
    let month = parts[0]; // e.g., "Apr"
    let day = parseInt(parts[1] || "1"); // e.g., "18" -> 18

    // Get month number from abbreviation (0-indexed)
    const monthMap: { [key: string]: number } = {
      Jan: 0,
      Feb: 1,
      Mar: 2,
      Apr: 3,
      May: 4,
      Jun: 5,
      Jul: 6,
      Aug: 7,
      Sep: 8,
      Oct: 9,
      Nov: 10,
      Dec: 11,
    };

    // Create a date object for this entry (using current year since it's not in the data)
    const currentYear = new Date().getFullYear();
    const monthNum = monthMap[month] !== undefined ? monthMap[month] : 0;
    const entryDate = new Date(currentYear, monthNum, day);

    // Calculate the week number within the month (1-indexed)
    // Week 1 starts with the first day of the month
    const firstDayOfMonth = new Date(currentYear, monthNum, 1);
    const daysSinceFirstDay = Math.floor(
      (entryDate.getTime() - firstDayOfMonth.getTime()) / (24 * 60 * 60 * 1000)
    );
    const weekOfMonth = Math.floor(daysSinceFirstDay / 7) + 1;

    return `W${weekOfMonth} ${month}`; // e.g., "W3 Apr"
  }

  // For 90 days, group into months but add the first day of the period
  else {
    // Try to extract month and day from entry name
    const parts = entry.name.split(" ");
    const month = parts[0];
    const day = parts.length > 1 ? parts[1] : "";
    return `${month} ${day}`; // e.g., "Apr 18"
  }
}

// Get descriptive text for the date range
function getRangeDescription(selectedRange: number = 7): string {
  // Default to 7 if selectedRange is undefined
  const range = selectedRange || 7;

  if (range <= 7) {
    return `Last ${range} Days`;
  } else if (range <= 30) {
    return `Last ${range} Days`;
  } else {
    return `Last ${range} Days`;
  }
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
      fontSize={12} // Slightly smaller font size
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
  selectedRange,
}: NutrientDensityVisualizationProps) {
  // Set a fixed chart height for consistency across all ranges
  const chartHeight = 250;

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
    const slicedData = data.slice(-range);

    // For 7 days or less, process normally but with better naming
    if (range <= 7) {
      return slicedData
        .map((entry, index) => {
          const { proteinPct, carbsPct, fatsPct } = getMacroPercentages(entry);
          const hasNoMacros =
            entry.protein === 0 && entry.carbs === 0 && entry.fats === 0;

          return {
            name: formatDateName(entry, index, range, slicedData.length),
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

    // For longer ranges (30 or 90 days), group data
    const groupSize = Math.ceil(slicedData.length / displayLimit);
    const groupedData = [];

    // For 30-day view, ensure week labels are unique and chronological
    if (range <= 30) {
      // First, find the earliest and latest dates in the data set
      const oldestDate = slicedData[0]?.name;
      const newestDate = slicedData[slicedData.length - 1]?.name;

      console.log(`Data range: ${oldestDate} to ${newestDate}`);

      const groupSize = Math.ceil(slicedData.length / displayLimit); // groupSize for 30-day view
      const currentGroupedData = []; // Renamed to avoid conflict

      // Create groups with unambiguous date ranges
      for (let i = 0; i < slicedData.length; i += groupSize) {
        const group = slicedData.slice(i, i + groupSize);
        if (!group.length) continue;

        // Use first (oldest) and last (newest) dates in this group for the label
        const firstEntry = group[0];
        const lastEntry = group[group.length - 1];

        // Create a clear group label showing the date range
        let groupLabel = "";

        if (group.length === 1) {
          // For a single day, just show that date
          groupLabel = formatDateName(firstEntry, 0, range, slicedData.length);
        } else {
          // For multiple days, show range from first to last in group
          const firstParts = firstEntry.name.split(" ");
          const lastParts = lastEntry.name.split(" ");

          const firstMonth = firstParts[0];
          const firstDay = firstParts.length > 1 ? firstParts[1] : "";
          const lastMonth = lastParts[0];
          const lastDay = lastParts.length > 1 ? lastParts[1] : "";

          if (firstMonth === lastMonth) {
            groupLabel = `${firstMonth} ${firstDay}-${lastDay}`;
          } else {
            groupLabel = `${firstMonth} ${firstDay}-${lastMonth} ${lastDay}`;
          }
        }

        const groupAvg = {
          name: groupLabel, // Added name for getMacroPercentages
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

        currentGroupedData.push({
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

      return currentGroupedData.reverse();
    }
    // For 90+ days view (e.g., selectedRange > 30)
    else {
      const monthAggregates = new Map<
        string,
        {
          proteinSum: number;
          carbsSum: number;
          fatsSum: number;
          caloriesSum: number;
          count: number;
          originalNamesInMonth: string[];
        }
      >();
      const monthOrder: string[] = []; // To preserve order of months

      slicedData.forEach((entry) => {
        const month = entry.name.split(" ")[0]; // Assumes "Month Day" format e.g. "Apr"

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
        const aggregate = monthAggregates.get(month)!;
        aggregate.proteinSum += entry.protein;
        aggregate.carbsSum += entry.carbs;
        aggregate.fatsSum += entry.fats;
        aggregate.caloriesSum += entry.calories;
        aggregate.count += 1;
        aggregate.originalNamesInMonth.push(entry.name);
      });

      let monthlyChartData = monthOrder.map((monthName) => {
        const aggregate = monthAggregates.get(monthName)!;
        const avg = {
          name: monthName, // Add name property for getMacroPercentages
          protein:
            aggregate.count > 0 ? aggregate.proteinSum / aggregate.count : 0,
          carbs: aggregate.count > 0 ? aggregate.carbsSum / aggregate.count : 0,
          fats: aggregate.count > 0 ? aggregate.fatsSum / aggregate.count : 0,
          calories:
            aggregate.count > 0 ? aggregate.caloriesSum / aggregate.count : 0,
        };
        const { proteinPct, carbsPct, fatsPct } = getMacroPercentages(avg);
        const hasNoMacros =
          avg.protein === 0 && avg.carbs === 0 && avg.fats === 0;

        let monthDateRange = monthName;
        if (aggregate.originalNamesInMonth.length > 0) {
          const firstDateStr = aggregate.originalNamesInMonth[0];
          const lastDateStr =
            aggregate.originalNamesInMonth[
              aggregate.originalNamesInMonth.length - 1
            ];
          monthDateRange =
            aggregate.originalNamesInMonth.length === 1
              ? firstDateStr
              : `${firstDateStr} to ${lastDateStr}`;
        }

        return {
          name: monthName, // Bar label is the month name
          protein: hasNoMacros ? 0 : proteinPct,
          carbs: hasNoMacros ? 0 : carbsPct,
          fats: hasNoMacros ? 0 : fatsPct,
          emptyBar: hasNoMacros ? 100 : 0,
          gProtein: avg.protein.toFixed(1),
          gCarbs: avg.carbs.toFixed(1),
          gFats: avg.fats.toFixed(1),
          calories: Math.round(avg.calories),
          hasNoMacros,
          originalDateRange: monthDateRange,
        };
      });

      // Display the latest 'displayLimit' months
      if (monthlyChartData.length > displayLimit) {
        monthlyChartData = monthlyChartData.slice(-displayLimit);
      }

      return monthlyChartData.reverse(); // Reverse for chart display (latest first)
    }
  }, [data, selectedRange, displayLimit]);

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
          <span className="text-sm text-gray-400 truncate max-w-[160px] block">
            {getRangeDescription(selectedRange)}
          </span>
        </div>
      </div>

      {/* Chart Section */}
      <div className="flex-1 min-h-[150px]">
        <ResponsiveContainer width="100%" height={chartHeight} minHeight={150}>
          <BarChart
            data={chartData}
            layout="vertical"
            margin={{ top: 15, right: 15, left: -10, bottom: 10 }} // Adjusted margins
            barCategoryGap="25%" // Adjusted gap
            barSize={18} // Adjusted bar size - increased from 10 to 18
          >
            <defs>
              {Object.entries(COLORS).map(([key, color]) => {
                // Ensure color object and gradient property exist
                if (!color || !Array.isArray(color.gradient)) return null;
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
              tick={{ fill: "#9ca3af", fontSize: 10 }}
              tickFormatter={(v) => `${v}%`}
              interval="preserveStartEnd"
              tickCount={5}
            />
            <YAxis
              dataKey="name"
              type="category"
              tick={{ fill: "#d1d5db", fontSize: 12 }}
              axisLine={false}
              tickLine={false}
              width={75}
              interval={0}
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
                    originalDate?: string;
                    originalDateRange?: string;
                    name?: string;
                  };
                }
              ) => {
                const item = props.payload;
                if (item) {
                  // For macros data
                  const gramValue =
                    name === "Protein" // Match Bar name prop
                      ? item.gProtein
                      : name === "Carbs"
                      ? item.gCarbs
                      : name === "Fats"
                      ? item.gFats
                      : "N/A";

                  // Add date context information for grouped data (30+ days)
                  if (selectedRange && selectedRange > 7) {
                    const dateInfo =
                      item.originalDateRange || item.originalDate || item.name;
                    // For grouped data, show the original date in tooltip
                    return [
                      `${gramValue}g (${value}%)`,
                      `${name} (${dateInfo})`,
                    ];
                  }

                  return [`${gramValue}g (${value}%)`, name];
                }
                return [`${value}%`, name];
              }}
            />
            <Legend
              iconType="circle"
              iconSize={10}
              verticalAlign="bottom"
              align="center"
              height={12}
              wrapperStyle={{
                fontSize: 12,
                paddingTop: 2,
              }}
              formatter={(value) => (
                <span className="text-gray-300 capitalize ml-1">{value}</span>
              )}
            />
            <Bar
              dataKey="protein"
              stackId="a"
              fill={`url(#colorprotein)`}
              radius={[10, 0, 0, 10]}
              name="Protein"
              animationDuration={1000}
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
              radius={[0, 10, 10, 0]} // Smaller radius
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
