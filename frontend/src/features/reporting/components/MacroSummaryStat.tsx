import { useMemo } from "react";
import { format, parseISO } from "date-fns";

import TargetRow from "@/features/macroTracking/components/TargetRow";

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
  /** Every day in the range, untracked days as zero; drawn as one bar per day on a phone. */
  dailySeries?: (MacroSummaryStatsProps["data"][number] & { date: string })[];
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

  let avgGrams: { protein: number; carbs: number; fats: number };
  let avgConsumedCalories: number;

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


export default function MacroSummaryStats({
  data,
  calorieTarget,
  macroTarget,
  trackedDays,
  averages,
  dailySeries,
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

  // Four rows of one list, each average against its target with a bar per day,
  // so the summary reads top to bottom at any width.
  return (
    <div>
      <p className="mb-4 text-xs text-muted">
        Daily average{trackedDays === undefined ? "" : ` over ${trackedDays} tracked ${trackedDays === 1 ? "day" : "days"}`}
      </p>
      <ul className="space-y-5">
        <TargetRow
          name="Calories"
          value={avgCalories}
          target={effectiveCalorieTarget}
          unit="kcal"
          colorClass="bg-primary"
          shortfallLabel="under"
          days={dailySeries?.map((day) => day.calories)}
        />
        <TargetRow
          name="Protein"
          value={macroAvg.gProtein}
          target={targetGrams.protein}
          unit="g"
          colorClass="bg-protein"
          shortfallLabel="under"
          days={dailySeries?.map((day) => day.protein)}
        />
        <TargetRow
          name="Carbs"
          value={macroAvg.gCarbs}
          target={targetGrams.carbs}
          unit="g"
          colorClass="bg-carbs"
          shortfallLabel="under"
          days={dailySeries?.map((day) => day.carbs)}
        />
        <TargetRow
          name="Fats"
          value={macroAvg.gFats}
          target={targetGrams.fats}
          unit="g"
          colorClass="bg-fats"
          shortfallLabel="under"
          days={dailySeries?.map((day) => day.fats)}
          dayLabels={
            dailySeries && dailySeries.length <= 7
              ? dailySeries.map((day) => format(parseISO(day.date), "EEEEE"))
              : undefined
          }
        />
      </ul>
    </div>
  );
}
