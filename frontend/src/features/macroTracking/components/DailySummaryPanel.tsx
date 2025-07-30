// src/features/macroTracking/components/DailySummaryPanel.tsx

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import { MacroTargetBar, MacroTargetLegend } from "@/components/macros";
import ProgressBar from "@/components/ui/ProgressBar";
import { MacroDailyTotals, MacroTargetSettings } from "@/types/macro";

import {
  calculateCaloriesFromMacros,
  calculateCarbsCalories,
  calculateFatsCalories,
  calculateProteinCalories,
} from "../calculations";

interface DailySummaryProps {
  macroDailyTotals?: MacroDailyTotals;
  macroTarget?: MacroTargetSettings;
  calorieTarget?: number;
}

export default function DailySummary({
  macroDailyTotals,
  macroTarget,
  calorieTarget,
}: DailySummaryProps) {
  // --- Defaults ---
  const DEFAULT_TARGET = {
    proteinPercentage: 30,
    carbsPercentage: 40,
    fatsPercentage: 30,
  };
  const EMPTY_TOTALS: MacroDailyTotals = {
    protein: 0,
    carbs: 0,
    fats: 0,
    calories: 0,
  };

  // --- Safe values ---
  const safeTotal = macroDailyTotals || EMPTY_TOTALS;
  const target = macroTarget || DEFAULT_TARGET;
  const dailyCalorieTarget = calorieTarget || 0;

  // --- Macro calorie calculations ---
  const totalCalories = calculateCaloriesFromMacros(
    safeTotal.protein,
    safeTotal.carbs,
    safeTotal.fats,
  );
  const proteinCalories = calculateProteinCalories(safeTotal.protein);
  const carbsCalories = calculateCarbsCalories(safeTotal.carbs);
  const fatsCalories = calculateFatsCalories(safeTotal.fats);

  // --- Macro targets (grams) ---
  const targetProteinGrams = Math.round(
    (dailyCalorieTarget * target.proteinPercentage) / 100 / 4,
  );
  const targetCarbsGrams = Math.round(
    (dailyCalorieTarget * target.carbsPercentage) / 100 / 4,
  );
  const targetFatsGrams = Math.round(
    (dailyCalorieTarget * target.fatsPercentage) / 100 / 9,
  );

  // --- Completion percentages ---
  function percent(actual: number, targetValue: number) {
    if (!targetValue) return 0;
    return Math.min(100, Math.round((actual / targetValue) * 100) || 0);
  }
  const proteinCompletionPercent = percent(
    safeTotal.protein,
    targetProteinGrams,
  );
  const carbsCompletionPercent = percent(safeTotal.carbs, targetCarbsGrams);
  const fatsCompletionPercent = percent(safeTotal.fats, targetFatsGrams);
  const calorieCompletionPercent = percent(totalCalories, dailyCalorieTarget);

  // --- Macro calorie percentages ---
  const totalMacroCalories = totalCalories;
  const proteinPercent =
    totalMacroCalories === 0
      ? 0
      : Math.round((proteinCalories / totalMacroCalories) * 100);
  const carbsPercent =
    totalMacroCalories === 0
      ? 0
      : Math.round((carbsCalories / totalMacroCalories) * 100);
  const fatsPercent =
    totalMacroCalories === 0 ? 0 : 100 - proteinPercent - carbsPercent;

  // --- Macro data for rendering ---
  const macroData = [
    {
      name: "Protein",
      grams: Math.round(safeTotal.protein),
      targetGrams: targetProteinGrams,
      calories: proteinCalories,
      targetPercent: target.proteinPercentage,
      actualPercent: proteinPercent,
      color: "bg-protein",
      textColor: "text-protein",
      borderColor: "border-protein/20",
      gradientFrom: "from-protein/30",
      completionPercent: proteinCompletionPercent,
    },
    {
      name: "Carbs",
      grams: Math.round(safeTotal.carbs),
      targetGrams: targetCarbsGrams,
      calories: carbsCalories,
      targetPercent: target.carbsPercentage,
      actualPercent: carbsPercent,
      color: "bg-carbs",
      textColor: "text-carbs",
      borderColor: "border-carbs/20",
      gradientFrom: "from-carbs/30",
      completionPercent: carbsCompletionPercent,
    },
    {
      name: "Fats",
      grams: Math.round(safeTotal.fats),
      targetGrams: targetFatsGrams,
      calories: fatsCalories,
      targetPercent: target.fatsPercentage,
      actualPercent: fatsPercent,
      color: "bg-fats",
      textColor: "text-fats",
      borderColor: "border-fats/20",
      gradientFrom: "from-fats/30",
      completionPercent: fatsCompletionPercent,
    },
  ];

  return (
    <div className="bg-surface backdrop-blur-sm rounded-2xl border border-border/50 shadow-modal overflow-hidden h-full">
      <div className="p-6 flex flex-col h-full">
        <div className="bg-muted/10 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-foreground">
              Today's Summary
            </h2>{" "}
            <div className="text-right">
              <div className="text-2xl font-bold text-foreground">
                <AnimatedNumber
                  value={totalCalories}
                  toFixedValue={0}
                  duration={0.8}
                />
              </div>
              <div className="text-xs text-foreground">
                <span>of </span>
                <span className="font-medium text-foreground">
                  <AnimatedNumber
                    value={dailyCalorieTarget}
                    toFixedValue={0}
                    duration={0.6}
                  />
                </span>
                <span> kcal</span>

                <span className="ml-1 font-medium text-foreground">
                  (
                  <AnimatedNumber
                    value={calorieCompletionPercent}
                    toFixedValue={0}
                    suffix="%"
                    duration={0.5}
                  />
                  )
                </span>
              </div>
            </div>
          </div>

          <ProgressBar
            progress={calorieCompletionPercent}
            color="accent"
            height="md"
            className="mb-4"
          />

          <MacroTargetBar
            macros={{
              protein: proteinCalories,
              carbs: carbsCalories,
              fats: fatsCalories,
            }}
          />

          <MacroTargetLegend
            macros={{
              protein: safeTotal.protein,
              carbs: safeTotal.carbs,
              fats: safeTotal.fats,
            }}
            className="mt-2"
          />
        </div>

        <div className="space-y-4">
          {macroData.map((macro) => (
            <div
              key={macro.name}
              className={`bg-gradient-to-br ${macro.gradientFrom} to-gray-800/10 p-4 rounded-xl border ${macro.borderColor}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${macro.color}`}></div>
                  <h3 className={`${macro.textColor} text-sm font-medium`}>
                    {macro.name}
                  </h3>
                </div>{" "}
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground">
                    <AnimatedNumber
                      value={macro.grams}
                      toFixedValue={0}
                      suffix="g"
                      duration={0.7}
                    />
                  </span>
                  <span className="text-xs text-foreground ml-1">
                    /{" "}
                    <AnimatedNumber
                      value={macro.targetGrams}
                      toFixedValue={0}
                      suffix="g"
                      duration={0.5}
                    />
                  </span>
                </div>
              </div>
              <ProgressBar
                progress={macro.completionPercent}
                color={macro.name.toLowerCase() as "protein" | "carbs" | "fats"}
                height="md"
                className="mb-3"
              />{" "}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${macro.textColor}`}>
                    <AnimatedNumber
                      value={macro.calories}
                      toFixedValue={0}
                      suffix=" kcal"
                      duration={0.6}
                    />
                  </span>
                </div>
                <div className="flex items-center text-xs">
                  <span className={`text-xs ${macro.textColor} ml-1`}>
                    <AnimatedNumber
                      value={macro.completionPercent}
                      toFixedValue={0}
                      suffix="%"
                      duration={0.5}
                    />
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
