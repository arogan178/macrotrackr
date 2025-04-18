import React, { useMemo } from "react";
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

type MacroType = "protein" | "carbs" | "fats";

interface MacroSummaryStatsProps {
  data: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }[];
}

function getMacroPercentages(entry: MacroSummaryStatsProps["data"][0]) {
  const { protein, carbs, fats, calories } = entry;
  if (!calories || calories === 0)
    return { proteinPct: 0, carbsPct: 0, fatsPct: 0 };
  const proteinCals = protein * 4;
  const carbsCals = carbs * 4;
  const fatsCals = fats * 9;
  const totalMacroCals = proteinCals + carbsCals + fatsCals;
  const divisor = totalMacroCals > 0 ? totalMacroCals : calories;
  if (divisor === 0) return { proteinPct: 0, carbsPct: 0, fatsPct: 0 };
  return {
    proteinPct: Math.round((proteinCals / divisor) * 100),
    carbsPct: Math.round((carbsCals / divisor) * 100),
    fatsPct: Math.round((fatsCals / divisor) * 100),
  };
}

// Modified function to accept calorieTarget for percentage calculation
function calculateAverageMacros(
  data: MacroSummaryStatsProps["data"],
  calorieTarget: number // Added calorieTarget parameter
) {
  if (!data.length) return null;
  const totalMacros = data.reduce(
    (acc, entry) => {
      acc.protein += entry.protein;
      acc.carbs += entry.carbs;
      acc.fats += entry.fats;
      acc.calories += entry.calories; // Still track average consumed calories
      return acc;
    },
    { protein: 0, carbs: 0, fats: 0, calories: 0 }
  );
  const numDays = data.length;
  const avgGrams = {
    protein: totalMacros.protein / numDays,
    carbs: totalMacros.carbs / numDays,
    fats: totalMacros.fats / numDays,
  };
  const avgConsumedCalories = totalMacros.calories / numDays;

  // Calculate percentages based on average grams relative to the calorie TARGET
  const divisor = calorieTarget > 0 ? calorieTarget : 2000; // Use target, fallback to 2000
  const proteinPct = Math.round(((avgGrams.protein * 4) / divisor) * 100);
  const carbsPct = Math.round(((avgGrams.carbs * 4) / divisor) * 100);
  const fatsPct = Math.round(((avgGrams.fats * 9) / divisor) * 100);

  return {
    name: "Average",
    protein: proteinPct,
    carbs: carbsPct,
    fats: fatsPct,
    gProtein: parseFloat(avgGrams.protein.toFixed(1)),
    gCarbs: parseFloat(avgGrams.carbs.toFixed(1)),
    gFats: parseFloat(avgGrams.fats.toFixed(1)),
    calories: Math.round(avgConsumedCalories), // Return the actual average consumed calories
  };
}

const MacroSummaryItem = React.memo(
  ({
    type,
    avgPercentage,
    avgGrams,
    targetPercentage,
    targetGrams,
  }: // todayPercentage,
  // todayGrams,
  {
    type: MacroType;
    avgPercentage: number;
    avgGrams: number;
    targetPercentage: number;
    targetGrams: number;
    todayPercentage: number;
    todayGrams: string;
  }) => {
    const percentageDelta = avgPercentage - targetPercentage;
    const gramDelta = avgGrams - targetGrams;
    const color = COLORS[type].base;

    return (
      <div className="flex-1 text-xs flex flex-col justify-between h-full">
        {/* Header: Macro Name + Deviation Indicator (now based on grams) */}
        <div className="flex items-center justify-between mb-2">
          <span className="font-semibold text-lg" style={{ color }}>
            {type.charAt(0).toUpperCase() + type.slice(1)}
          </span>
        </div>

        {/* Average Intake vs Target */}
        <div className="space-y-1 mb-2">
          {/* Average Intake Display */}
          <div className="flex items-baseline justify-between">
            <span className="text-gray-400 text-xs mr-1">Average Intake:</span>
            <div className="text-right">
              <span className="text-lg font-bold text-white leading-none">
                {avgGrams.toFixed(1)}g
              </span>
              <span className="text-gray-400 text-xs ml-1">
                ({avgPercentage}%)
              </span>
            </div>
          </div>
          {/* Your Target Display */}
          <div className="flex items-baseline justify-between">
            <span className="text-gray-500 text-xs mr-1">Your Target:</span>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-300">
                {targetGrams.toFixed(1)}g
              </span>
              <span className="text-gray-500 text-xs ml-1">
                ({targetPercentage}%)
              </span>
            </div>
          </div>
        </div>

        {/* Difference from Target */}
        <div className="flex items-baseline justify-between text-gray-400 mt-auto pt-1 border-t border-gray-700/50">
          <span className="text-xs mr-1.5">Difference:</span>
          <div className="text-right">
            <span
              className={`text-sm font-semibold ${
                gramDelta >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              {gramDelta >= 0 ? "+" : ""}
              {gramDelta.toFixed(1)}g
            </span>
            <span
              className={`text-xs ml-1.5 ${
                percentageDelta >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              ({percentageDelta >= 0 ? "+" : ""}
              {Math.round(percentageDelta)}%)
            </span>
          </div>
        </div>
      </div>
    );
  }
);

export default function MacroSummaryStats({ data }: MacroSummaryStatsProps) {
  const macroTarget = useStore((state) => state.macroTarget);
  const calorieTarget = useStore((state) => state.weightGoals?.calorieTarget);
  const effectiveCalorieTarget = calorieTarget || 2000; // Use stored target or default

  const TARGET_MACROS = useMemo(
    () =>
      macroTarget || {
        proteinPercentage: 30,
        carbsPercentage: 40,
        fatsPercentage: 30,
      },
    [macroTarget]
  );

  // Calculate Target Grams
  const targetGrams = useMemo(() => {
    // Use effectiveCalorieTarget here
    const proteinG =
      (effectiveCalorieTarget * (TARGET_MACROS.proteinPercentage / 100)) / 4;
    const carbsG =
      (effectiveCalorieTarget * (TARGET_MACROS.carbsPercentage / 100)) / 4;
    const fatsG =
      (effectiveCalorieTarget * (TARGET_MACROS.fatsPercentage / 100)) / 9;
    return {
      protein: proteinG,
      carbs: carbsG,
      fats: fatsG,
    };
    // Dependency updated
  }, [effectiveCalorieTarget, TARGET_MACROS]);

  // Average calories over selected range (still based on actual consumption)
  const avgCalories = useMemo(() => {
    if (!data.length) return 0;
    const total = data.reduce((acc, d) => acc + d.calories, 0);
    return Math.round(total / data.length);
  }, [data]);

  // Macro averages (main display) over selected range
  // Pass effectiveCalorieTarget to the calculation function
  const macroAvg = useMemo(() => {
    return calculateAverageMacros(data, effectiveCalorieTarget);
    // Dependency updated
  }, [data, effectiveCalorieTarget]);

  // Last day entry (for 'Today' row - kept but not displayed for now)
  const lastDayEntry = data.length ? data[data.length - 1] : null;
  const todayMacros = useMemo(() => {
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
  }, [lastDayEntry]);

  if (!(macroAvg && todayMacros)) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
      {/* Macro Panels */}
      {/* "bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden" */}
      <div className="flex flex-col bg-gray-800/70 backdrop-blur-sm rounded-lg rounded-2xl border border-gray-700/50 p-3 shadow-xl h-full">
        <div className="flex-1 text-xs flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm text-gray-300">
              Calories
            </span>
          </div>
          <div className="space-y-1 mb-2">
            <div className="flex items-baseline justify-between">
              <span className="text-gray-400 text-xs mr-1">
                Average Intake:
              </span>
              <span className="text-lg font-bold text-white leading-none">
                {avgCalories} kcal
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-gray-500 text-xs mr-1">Your Target:</span>
              <span className="text-sm font-medium text-gray-300">
                {effectiveCalorieTarget} kcal
              </span>
            </div>
          </div>
          <div className="flex items-baseline justify-between text-gray-400 mt-auto pt-1 border-t border-gray-700/50">
            <span className="text-xs mr-1.5">Difference:</span>
            <span
              className={`text-sm font-semibold ${
                avgCalories - effectiveCalorieTarget >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              {avgCalories - effectiveCalorieTarget >= 0 ? "+" : ""}
              {(avgCalories - effectiveCalorieTarget).toFixed(0)} kcal
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col bg-gray-800/70 backdrop-blur-sm rounded-lg rounded-2xl border border-gray-700/50 p-3 shadow-xl h-full">
        <MacroSummaryItem
          type="protein"
          todayPercentage={todayMacros.protein}
          todayGrams={todayMacros.gProtein}
          avgPercentage={macroAvg.protein}
          avgGrams={macroAvg.gProtein}
          targetPercentage={TARGET_MACROS.proteinPercentage}
          targetGrams={targetGrams.protein}
        />
      </div>
      <div className="flex flex-col bg-gray-800/70 backdrop-blur-sm rounded-lg rounded-2xl border border-gray-700/50 p-3 shadow-xl h-full">
        <MacroSummaryItem
          type="carbs"
          todayPercentage={todayMacros.carbs}
          todayGrams={todayMacros.gCarbs}
          avgPercentage={macroAvg.carbs}
          avgGrams={macroAvg.gCarbs}
          targetPercentage={TARGET_MACROS.carbsPercentage}
          targetGrams={targetGrams.carbs}
        />
      </div>
      <div className="flex flex-col bg-gray-800/70 backdrop-blur-sm rounded-lg rounded-2xl border border-gray-700/50 p-3 shadow-xl h-full">
        <MacroSummaryItem
          type="fats"
          todayPercentage={todayMacros.fats}
          todayGrams={todayMacros.gFats}
          avgPercentage={macroAvg.fats}
          avgGrams={macroAvg.gFats}
          targetPercentage={TARGET_MACROS.fatsPercentage}
          targetGrams={targetGrams.fats}
        />
      </div>
    </div>
  );
}
