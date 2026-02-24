import { memo, useMemo } from "react";

import AnimatedNumber from "@/components/animation/AnimatedNumber";
import CardContainer from "@/components/form/CardContainer";
import { MacroTargetBar, MacroTargetLegend } from "@/components/macros";
import ProgressBar from "@/components/ui/ProgressBar";
import { MacroDailyTotals, MacroTargetSettings } from "@/types/macro";

import {
  calculateCaloriesFromMacros,
  calculateCarbsCalories,
  calculateFatsCalories,
  calculateProteinCalories,
} from "../calculations";

const DEFAULT_TARGET = {
  proteinPercentage: 30,
  carbsPercentage: 40,
  fatsPercentage: 30,
} as const;

const EMPTY_TOTALS: MacroDailyTotals = {
  protein: 0,
  carbs: 0,
  fats: 0,
  calories: 0,
};

function calculatePercent(actual: number, targetValue: number): number {
  if (!targetValue) return 0;
  const ratio = actual / targetValue;
  const pct = Math.floor(ratio * 100);
  return Math.max(0, Math.min(100, Number.isFinite(pct) ? pct : 0));
}

interface DailySummaryProps {
  macroDailyTotals?: MacroDailyTotals;
  macroTarget?: MacroTargetSettings;
  calorieTarget?: number;
}

function DailySummaryInner({
  macroDailyTotals,
  macroTarget,
  calorieTarget,
}: DailySummaryProps) {
  const safeTotal = macroDailyTotals || EMPTY_TOTALS;
  const target = macroTarget || DEFAULT_TARGET;
  const dailyCalorieTarget = calorieTarget || 0;

  const macroCalories = useMemo(
    () => ({
      total: calculateCaloriesFromMacros(
        safeTotal.protein,
        safeTotal.carbs,
        safeTotal.fats,
      ),
      protein: calculateProteinCalories(safeTotal.protein),
      carbs: calculateCarbsCalories(safeTotal.carbs),
      fats: calculateFatsCalories(safeTotal.fats),
    }),
    [safeTotal.protein, safeTotal.carbs, safeTotal.fats],
  );

  const targetGrams = useMemo(
    () => ({
      protein: Math.round(
        (dailyCalorieTarget * target.proteinPercentage) / 100 / 4,
      ),
      carbs: Math.round(
        (dailyCalorieTarget * target.carbsPercentage) / 100 / 4,
      ),
      fats: Math.round((dailyCalorieTarget * target.fatsPercentage) / 100 / 9),
    }),
    [
      dailyCalorieTarget,
      target.proteinPercentage,
      target.carbsPercentage,
      target.fatsPercentage,
    ],
  );

  const completionPercentages = useMemo(
    () => ({
      protein: calculatePercent(safeTotal.protein, targetGrams.protein),
      carbs: calculatePercent(safeTotal.carbs, targetGrams.carbs),
      fats: calculatePercent(safeTotal.fats, targetGrams.fats),
      calories: calculatePercent(macroCalories.total, dailyCalorieTarget),
    }),
    [
      safeTotal.protein,
      safeTotal.carbs,
      safeTotal.fats,
      targetGrams,
      macroCalories.total,
      dailyCalorieTarget,
    ],
  );

  const macroPercentages = useMemo(() => {
    const totalMacroCalories = macroCalories.total;
    if (totalMacroCalories === 0) {
      return { protein: 0, carbs: 0, fats: 0 };
    }
    const protein = Math.round(
      (macroCalories.protein / totalMacroCalories) * 100,
    );
    const carbs = Math.round((macroCalories.carbs / totalMacroCalories) * 100);
    const fats = 100 - protein - carbs;
    return { protein, carbs, fats };
  }, [macroCalories]);

  const macroData = useMemo(
    () => [
      {
        name: "Protein",
        grams: Math.round(safeTotal.protein),
        targetGrams: targetGrams.protein,
        calories: macroCalories.protein,
        targetPercent: target.proteinPercentage,
        actualPercent: macroPercentages.protein,
        color: "bg-protein",
        textColor: "text-protein",
        borderColor: "border-protein/20",
        gradientFrom: "from-protein/30",
        completionPercent: completionPercentages.protein,
      },
      {
        name: "Carbs",
        grams: Math.round(safeTotal.carbs),
        targetGrams: targetGrams.carbs,
        calories: macroCalories.carbs,
        targetPercent: target.carbsPercentage,
        actualPercent: macroPercentages.carbs,
        color: "bg-carbs",
        textColor: "text-carbs",
        borderColor: "border-carbs/20",
        gradientFrom: "from-carbs/30",
        completionPercent: completionPercentages.carbs,
      },
      {
        name: "Fats",
        grams: Math.round(safeTotal.fats),
        targetGrams: targetGrams.fats,
        calories: macroCalories.fats,
        targetPercent: target.fatsPercentage,
        actualPercent: macroPercentages.fats,
        color: "bg-fats",
        textColor: "text-fats",
        borderColor: "border-fats/20",
        gradientFrom: "from-fats/30",
        completionPercent: completionPercentages.fats,
      },
    ],
    [
      safeTotal.protein,
      safeTotal.carbs,
      safeTotal.fats,
      targetGrams,
      macroCalories,
      target.proteinPercentage,
      target.carbsPercentage,
      target.fatsPercentage,
      macroPercentages,
      completionPercentages,
    ],
  );

  return (
    <CardContainer className="h-full">
      <div className="flex h-full flex-col p-6">
        <div className="mb-6 rounded-xl bg-surface-2 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-base font-semibold text-foreground">
              Today's Summary
            </h2>
            <div className="text-right">
              <div className="text-2xl font-light tracking-tight text-foreground">
                <AnimatedNumber
                  value={macroCalories.total}
                  toFixedValue={0}
                  duration={0.8}
                />
              </div>
              <div className="text-xs text-muted">
                <span>of </span>
                <span className="font-medium text-muted">
                  <AnimatedNumber
                    value={dailyCalorieTarget}
                    toFixedValue={0}
                    duration={0.6}
                  />
                </span>
                <span> kcal</span>

                <span className="ml-1 font-medium text-primary">
                  (
                  <AnimatedNumber
                    value={completionPercentages.calories}
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
            progress={completionPercentages.calories}
            color="accent"
            height="lg"
            className="mb-4"
          />

          <MacroTargetBar
            macros={{
              protein: macroCalories.protein,
              carbs: macroCalories.carbs,
              fats: macroCalories.fats,
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

        <div className="space-y-3">
          {macroData.map((macro) => (
            <div
              key={macro.name}
              className={`rounded-xl border bg-surface-2 p-4 ${macro.borderColor} transition-colors duration-200 hover:bg-surface-3`}
            >
              <div className="mb-2 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`h-2 w-2 rounded-full ${macro.color}`}></div>
                  <h3 className={`${macro.textColor} text-sm font-medium`}>
                    {macro.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-foreground">
                    <AnimatedNumber
                      value={macro.grams}
                      toFixedValue={0}
                      suffix="g"
                      duration={0.7}
                    />
                  </span>
                  <span className="ml-1 text-xs text-muted">
                    /
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
                className="mb-2"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted">
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
    </CardContainer>
  );
}

const DailySummary = memo(DailySummaryInner);

export default DailySummary;
