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
  trackedDays?: number;
  totalDays?: number;
  averages?: {
    calories: number;
    protein: number;
    carbs: number;
    fats: number;
  };
}

// Modified function to accept calorieTarget and averages/trackedDays for percentage calculation
function calculateAverageMacros(
  data: MacroSummaryStatsProps["data"],
  calorieTarget: number,
  averagesFromProps?: MacroSummaryStatsProps["averages"],
  trackedDaysCount?: number,
) {
  if (data.length === 0 && !averagesFromProps) return;

  let avgGrams = { protein: 0, carbs: 0, fats: 0 };
  let avgConsumedCalories = 0;

  if (averagesFromProps) {
    avgGrams = {
      protein: averagesFromProps.protein,
      carbs: averagesFromProps.carbs,
      fats: averagesFromProps.fats,
    };
    avgConsumedCalories = averagesFromProps.calories;
  } else {
    const totalMacros = { protein: 0, carbs: 0, fats: 0, calories: 0 };
    for (const entry of data) {
      totalMacros.protein += entry.protein;
      totalMacros.carbs += entry.carbs;
      totalMacros.fats += entry.fats;
      totalMacros.calories += entry.calories;
    }
    const numberDays =
      trackedDaysCount && trackedDaysCount > 0
        ? trackedDaysCount
        : data.length > 0
          ? data.length
          : 1;
    avgGrams = {
      protein: totalMacros.protein / numberDays,
      carbs: totalMacros.carbs / numberDays,
      fats: totalMacros.fats / numberDays,
    };
    avgConsumedCalories = totalMacros.calories / numberDays;
  }

  // Calculate percentages based on average grams relative to consumed calories ratio
  const totalMacroCalories =
    avgGrams.protein * 4 + avgGrams.carbs * 4 + avgGrams.fats * 9;
  const divisor =
    avgConsumedCalories > 0
      ? avgConsumedCalories
      : totalMacroCalories > 0
        ? totalMacroCalories
        : calorieTarget > 0
          ? calorieTarget
          : 2000;

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
        {/* Average Intake Display */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="mr-1 text-xs text-muted shrink-0">Average Intake:</span>
          <div className="text-right min-w-0">
            <span className="text-lg leading-none font-bold text-foreground">
              <AnimatedNumber
                value={avgGrams}
                toFixedValue={1}
                suffix="g"
                duration={0.8}
              />
            </span>
            <span className="ml-1 text-xs text-muted whitespace-nowrap">
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
        </div>
        {/* Your Target Display */}
        <div className="flex items-baseline justify-between gap-2">
          <span className="mr-1 text-xs text-muted shrink-0">Your Target:</span>
          <div className="text-right min-w-0">
            <span className="text-sm font-medium text-foreground">
              <AnimatedNumber
                value={targetGrams}
                toFixedValue={1}
                suffix="g"
                duration={0.8}
              />
            </span>
            <span className="ml-1 text-xs text-muted whitespace-nowrap">
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
      </div>
      {/* Difference from Target */}
      <div className="mt-auto flex items-baseline justify-between gap-2 border-t border-border pt-1">
        <span className="mr-1.5 text-xs text-muted shrink-0">Difference:</span>
        <div className="text-right min-w-0 whitespace-nowrap">
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
  trackedDays,
  _totalDays,
  averages,
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
  }, [effectiveCalorieTarget, TARGET_MACROS]);

  // Macro averages (main display) over selected range
  const macroAvg = useMemo(() => {
    return calculateAverageMacros(
      data,
      effectiveCalorieTarget,
      averages,
      trackedDays,
    );
  }, [data, effectiveCalorieTarget, averages, trackedDays]);

  const avgCalories = macroAvg?.calories ?? 0;

  if (!macroAvg) return null;

  const cardClasses =
    "p-3.5 sm:p-4 border border-border bg-surface transition-colors duration-200 hover:border-border-2";

  const trackedSubtext =
    trackedDays !== undefined
      ? `Avg over ${trackedDays} tracked ${trackedDays === 1 ? "day" : "days"}`
      : null;

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
      {/* Calories Card */}
      <CardContainer variant="interactive" className={cardClasses}>
        <div className="flex flex-1 flex-col justify-between">
          <div className="mb-2 flex flex-wrap items-baseline justify-between gap-1">
            <span className="text-sm font-semibold text-foreground">
              Calories
            </span>
            {trackedSubtext && (
              <span className="text-[10px] text-muted shrink-0">
                {trackedSubtext}
              </span>
            )}
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
