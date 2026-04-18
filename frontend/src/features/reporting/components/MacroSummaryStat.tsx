import React, { useMemo } from "react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import CardContainer from "@/components/form/CardContainer";
import type { MacroType } from "@/types/macro";
import { MACRO_COLORS } from "@/utils/constants/macro";

interface MacroSummaryStatsProps {
  data: {
    name: string;
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  }[];
  calorieTarget: number;
  macroTarget?: {
    proteinPercentage: number;
    carbsPercentage: number;
    fatsPercentage: number;
  };
}

// Modified function to accept calorieTarget for percentage calculation
function calculateAverageMacros(
  data: MacroSummaryStatsProps["data"],
  calorieTarget: number,
) {
  if (data.length === 0) return;
  const totalMacros = { protein: 0, carbs: 0, fats: 0, calories: 0 };
  for (const entry of data) {
    totalMacros.protein += entry.protein;
    totalMacros.carbs += entry.carbs;
    totalMacros.fats += entry.fats;
    totalMacros.calories += entry.calories;
  }
  const numberDays = data.length;
  const avgGrams = {
    protein: totalMacros.protein / numberDays,
    carbs: totalMacros.carbs / numberDays,
    fats: totalMacros.fats / numberDays,
  };
  const avgConsumedCalories = totalMacros.calories / numberDays;

  // Calculate percentages based on average grams relative to the calorie TARGET
  const divisor = calorieTarget > 0 ? calorieTarget : 2000;
  const proteinPct = Math.round(((avgGrams.protein * 4) / divisor) * 100);
  const carbsPct = Math.round(((avgGrams.carbs * 4) / divisor) * 100);
  const fatsPct = Math.round(((avgGrams.fats * 9) / divisor) * 100);

  return {
    name: "Average",
    protein: proteinPct,
    carbs: carbsPct,
    fats: fatsPct,
    gProtein: Number.parseFloat(avgGrams.protein.toFixed(1)),
    gCarbs: Number.parseFloat(avgGrams.carbs.toFixed(1)),
    gFats: Number.parseFloat(avgGrams.fats.toFixed(1)),
    calories: Math.round(avgConsumedCalories),
  };
}

const MacroSummaryItem = React.memo(function MacroSummaryItem({
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
}) {
  const percentageDelta = avgPercentage - targetPercentage;
  const gramDelta = avgGrams - targetGrams;

  return (
    <div className="flex h-full flex-1 flex-col justify-between text-xs">
      {/* Header: Macro Name + Deviation Indicator (now based on grams) */}
      <div className="mb-2 flex items-center justify-between">
        <span
          className="text-lg font-semibold"
          style={{ color: MACRO_COLORS[type].base }}
        >
          {type.charAt(0).toUpperCase() + type.slice(1)}
        </span>
      </div>
      {/* Average Intake vs Target */}
      <div className="mb-2 space-y-1">
        {" "}
        {/* Average Intake Display */}
        <div className="flex items-baseline justify-between">
          <span className="mr-1 text-xs text-muted">Average Intake:</span>
          <div className="text-right">
            <span className="text-lg leading-none font-bold text-foreground">
              <AnimatedNumber
                value={avgGrams}
                toFixedValue={1}
                suffix="g"
                duration={0.8}
              />
            </span>
            <span className="ml-1 text-xs text-muted">
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
          <span className="mr-1 text-xs text-muted">Your Target:</span>
          <div className="text-right">
            <span className="text-sm font-medium text-foreground">
              <AnimatedNumber
                value={targetGrams}
                toFixedValue={1}
                suffix="g"
                duration={0.8}
              />
            </span>
            <span className="ml-1 text-xs text-muted">
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
      <div className="mt-auto flex items-baseline justify-between border-t border-border pt-1">
        <span className="mr-1.5 text-xs text-muted">Difference:</span>
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
            className={`ml-1.5 text-xs ${
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
});
MacroSummaryItem.displayName = "MacroSummaryItem";

export default function MacroSummaryStats({
  data,
  calorieTarget,
  macroTarget,
}: MacroSummaryStatsProps) {
  const effectiveCalorieTarget = calorieTarget || 2000;

  const TARGET_MACROS = useMemo(
    () =>
      macroTarget ?? {
        proteinPercentage: 30,
        carbsPercentage: 40,
        fatsPercentage: 30,
      },
    [macroTarget],
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
    if (data.length === 0) return 0;
    const total = data.reduce((accumulator, d) => accumulator + d.calories, 0);

    return Math.round(total / data.length);
  }, [data]);

  // Macro averages (main display) over selected range
  // Pass effectiveCalorieTarget to the calculation function
  const macroAvg = useMemo(() => {
    return calculateAverageMacros(data, effectiveCalorieTarget);
    // Dependency updated
  }, [data, effectiveCalorieTarget]);

  if (!macroAvg) return; // Updated early return condition

  const cardClasses = "px-4 py-3 border border-border/40 bg-surface transition-colors duration-200 hover:border-white/20";

  return (
    <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Calories Card */}
      <CardContainer variant="interactive" className={cardClasses}>
        <div className="flex flex-1 flex-col justify-between">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Calories
            </span>
          </div>
          <div className="mb-2 space-y-1">
            <div className="flex items-baseline justify-between">
              <span className="mr-1 text-xs text-muted">Average Intake:</span>
              <span className="text-lg leading-none font-bold text-foreground">
                <AnimatedNumber
                  value={avgCalories}
                  toFixedValue={0}
                  suffix=" kcal"
                  duration={0.8}
                />
              </span>
            </div>
            <div className="flex items-baseline justify-between">
              <span className="mr-1 text-xs text-muted">Your Target:</span>
              <span className="text-sm font-medium text-foreground">
                <AnimatedNumber
                  value={effectiveCalorieTarget}
                  toFixedValue={0}
                  suffix=" kcal"
                  duration={0.8}
                />
              </span>
            </div>
          </div>
          <div className="mt-auto flex items-baseline justify-between border-t border-border pt-1">
            <span className="mr-1.5 text-xs text-muted">Difference:</span>
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
      </CardContainer>

      {/* Protein Card */}
      <CardContainer variant="interactive" className={cardClasses}>
        <MacroSummaryItem
          type="protein"
          avgPercentage={macroAvg.protein}
          avgGrams={macroAvg.gProtein}
          targetPercentage={TARGET_MACROS.proteinPercentage}
          targetGrams={targetGrams.protein}
        />
      </CardContainer>

      {/* Carbs Card */}
      <CardContainer variant="interactive" className={cardClasses}>
        <MacroSummaryItem
          type="carbs"
          avgPercentage={macroAvg.carbs}
          avgGrams={macroAvg.gCarbs}
          targetPercentage={TARGET_MACROS.carbsPercentage}
          targetGrams={targetGrams.carbs}
        />
      </CardContainer>

      {/* Fats Card */}
      <CardContainer variant="interactive" className={cardClasses}>
        <MacroSummaryItem
          type="fats"
          avgPercentage={macroAvg.fats}
          avgGrams={macroAvg.gFats}
          targetPercentage={TARGET_MACROS.fatsPercentage}
          targetGrams={targetGrams.fats}
        />
      </CardContainer>
    </div>
  );
}
