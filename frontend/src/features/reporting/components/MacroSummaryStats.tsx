import React, { useMemo } from "react";
import { useStore } from "@/store/store";
import AnimatedNumber from "@/components/animation/AnimatedNumber";

// Enhanced colors - simplified
const COLORS = {
  protein: {
    base: "#34d399", // green-400
  },
  carbs: {
    base: "#60a5fa", // blue-400
  },
  fats: {
    base: "#f87171", // red-400
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
  calorieTarget: number;
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
  }: {
    type: MacroType;
    avgPercentage: number;
    avgGrams: number;
    targetPercentage: number;
    targetGrams: number;
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
          {" "}
          {/* Average Intake Display */}
          <div className="flex items-baseline justify-between">
            <span className="text-gray-400 text-xs mr-1">Average Intake:</span>
            <div className="text-right">
              <span className="text-lg font-bold text-white leading-none">
                <AnimatedNumber
                  value={avgGrams}
                  toFixedValue={1}
                  suffix="g"
                  duration={0.8}
                />
              </span>
              <span className="text-gray-400 text-xs ml-1">
                (
                <AnimatedNumber
                  value={avgPercentage}
                  toFixedValue={0}
                  suffix="%"
                  duration={0.6}
                />
                )
              </span>
            </div>
          </div>{" "}
          {/* Your Target Display */}
          <div className="flex items-baseline justify-between">
            <span className="text-gray-500 text-xs mr-1">Your Target:</span>
            <div className="text-right">
              <span className="text-sm font-medium text-gray-300">
                <AnimatedNumber
                  value={targetGrams}
                  toFixedValue={1}
                  suffix="g"
                  duration={0.8}
                />
              </span>
              <span className="text-gray-500 text-xs ml-1">
                (
                <AnimatedNumber
                  value={targetPercentage}
                  toFixedValue={0}
                  suffix="%"
                  duration={0.6}
                />
                )
              </span>
            </div>
          </div>
        </div>{" "}
        {/* Difference from Target */}
        <div className="flex items-baseline justify-between text-gray-400 mt-auto pt-1 border-t border-gray-700/50">
          <span className="text-xs mr-1.5">Difference:</span>
          <div className="text-right">
            <span
              className={`text-sm font-semibold ${
                gramDelta >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              <AnimatedNumber
                value={gramDelta}
                toFixedValue={1}
                suffix="g"
                prefix={gramDelta >= 0 ? "+" : ""}
                duration={0.8}
              />
            </span>
            <span
              className={`text-xs ml-1.5 ${
                percentageDelta >= 0 ? "text-emerald-400" : "text-rose-400"
              }`}
            >
              (
              <AnimatedNumber
                value={Math.round(percentageDelta)}
                toFixedValue={0}
                suffix="%"
                prefix={percentageDelta >= 0 ? "+" : ""}
                duration={0.6}
              />
              )
            </span>
          </div>
        </div>
      </div>
    );
  }
);

export default function MacroSummaryStats({
  data,
  calorieTarget,
}: MacroSummaryStatsProps) {
  const macroTarget = useStore((state) => state.macroTarget);
  const effectiveCalorieTarget = calorieTarget || 2000;

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

  if (!macroAvg) return null; // Updated early return condition

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* Macro Panels */}
      {/* "bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 shadow-xl overflow-hidden" */}
      <div className="flex flex-col bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-3 shadow-xl h-full">
        <div className="flex-1 text-xs flex flex-col justify-between h-full">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-sm text-gray-300">
              Calories
            </span>
          </div>{" "}
          <div className="space-y-1 mb-2">
            <div className="flex items-baseline justify-between">
              <span className="text-gray-400 text-xs mr-1">
                Average Intake:
              </span>
              <span className="text-lg font-bold text-white leading-none">
                <AnimatedNumber
                  value={avgCalories}
                  toFixedValue={0}
                  suffix=" kcal"
                  duration={0.8}
                />
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="text-gray-500 text-xs mr-1">Your Target:</span>
              <span className="text-sm font-medium text-gray-300">
                <AnimatedNumber
                  value={effectiveCalorieTarget}
                  toFixedValue={0}
                  suffix=" kcal"
                  duration={0.8}
                />
              </span>
            </div>
          </div>{" "}
          <div className="flex items-baseline justify-between text-gray-400 mt-auto pt-1 border-t border-gray-700/50">
            <span className="text-xs mr-1.5">Difference:</span>
            <span
              className={`text-sm font-semibold ${
                avgCalories - effectiveCalorieTarget >= 0
                  ? "text-emerald-400"
                  : "text-rose-400"
              }`}
            >
              <AnimatedNumber
                value={avgCalories - effectiveCalorieTarget}
                toFixedValue={0}
                suffix=" kcal"
                prefix={avgCalories - effectiveCalorieTarget >= 0 ? "+" : ""}
                duration={0.8}
              />
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-col bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-3 shadow-xl h-full">
        <MacroSummaryItem
          type="protein"
          avgPercentage={macroAvg.protein}
          avgGrams={macroAvg.gProtein}
          targetPercentage={TARGET_MACROS.proteinPercentage}
          targetGrams={targetGrams.protein}
        />
      </div>
      <div className="flex flex-col bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-3 shadow-xl h-full">
        <MacroSummaryItem
          type="carbs"
          avgPercentage={macroAvg.carbs}
          avgGrams={macroAvg.gCarbs}
          targetPercentage={TARGET_MACROS.carbsPercentage}
          targetGrams={targetGrams.carbs}
        />
      </div>
      <div className="flex flex-col bg-gray-800/70 backdrop-blur-sm rounded-2xl border border-gray-700/50 p-3 shadow-xl h-full">
        <MacroSummaryItem
          type="fats"
          avgPercentage={macroAvg.fats}
          avgGrams={macroAvg.gFats}
          targetPercentage={TARGET_MACROS.fatsPercentage}
          targetGrams={targetGrams.fats}
        />
      </div>
    </div>
  );
}
