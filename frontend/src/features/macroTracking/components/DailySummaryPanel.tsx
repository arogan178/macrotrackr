import { memo, useMemo, useState } from "react";

import {
  MacroDistributionBar,
  MacroTargetLegend,
} from "@/components/macros/MacroComponents";
import Heading from "@/components/ui/Heading";
import IconButton from "@/components/ui/IconButton";
import Panel from "@/components/ui/Panel";
import ProgressBar from "@/components/ui/ProgressBar";
import Value from "@/components/ui/Value";
import MacroSnapshotModal from "@/features/macroTracking/components/MacroSnapshotModal";
import type { MacroSnapshotData } from "@/features/macroTracking/utils/macroSnapshotCanvas";
import { MacroDailyTotals, MacroTargetSettings } from "@/types/macro";
import { getDisplayDate } from "@/utils/dateUtilities";

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
  const [isSnapshotOpen, setIsSnapshotOpen] = useState(false);
  const safeTotal = macroDailyTotals ?? EMPTY_TOTALS;
  const target = macroTarget ?? DEFAULT_TARGET;
  const dailyCalorieTarget = calorieTarget ?? 0;

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

  const snapshotData: MacroSnapshotData = useMemo(
    () => ({
      title: "Today's Macros",
      dateLabel: getDisplayDate(new Date()),
      calories: macroCalories.total,
      calorieTarget: dailyCalorieTarget,
      protein: safeTotal.protein,
      proteinTarget: targetGrams.protein,
      carbs: safeTotal.carbs,
      carbsTarget: targetGrams.carbs,
      fats: safeTotal.fats,
      fatsTarget: targetGrams.fats,
      complianceScore: completionPercentages.calories,
    }),
    [
      macroCalories.total,
      dailyCalorieTarget,
      safeTotal.protein,
      targetGrams.protein,
      safeTotal.carbs,
      targetGrams.carbs,
      safeTotal.fats,
      targetGrams.fats,
      completionPercentages.calories,
    ],
  );

  return (
    <Panel padding="none" className="flex flex-col">
      {/* One idea — calories, then its macro breakdown — so one panel, split by
          dividers. It used to be six bordered boxes. */}
      <div className="p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <Heading level="panel">Today</Heading>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">
              {completionPercentages.calories}% of target
            </span>
            <IconButton
              variant="share"
              buttonSize="sm"
              iconSize="sm"
              ariaLabel="Share Snapshot"
              onClick={() => setIsSnapshotOpen(true)}
            />
          </div>
        </div>

        {/* The one animated number on the page: the value that moves. */}
        <Value
          className="mt-3"
          size="hero"
          unit="kcal"
          animate
          value={macroCalories.total}
          suffix={`of ${Math.round(dailyCalorieTarget).toLocaleString()}`}
        />

        <ProgressBar
          progress={completionPercentages.calories}
          color="accent"
          height="lg"
          className="mt-4"
        />

        <MacroDistributionBar
          macros={{
            protein: macroCalories.protein,
            carbs: macroCalories.carbs,
            fats: macroCalories.fats,
          }}
          className="mt-3"
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

      <div className="flex flex-col">
        {macroData.map((macro) => (
          <div
            key={macro.name}
            className="border-t border-border px-4 py-3 sm:px-6"
          >
            <div className="flex items-baseline justify-between gap-3">
              <span className="flex items-center gap-2">
                <span className={`h-2 w-2 shrink-0 rounded-full ${macro.color}`} />
                <span className="text-sm font-medium">{macro.name}</span>
              </span>
              <Value
                value={macro.grams}
                unit="g"
                suffix={`of ${macro.targetGrams}`}
              />
            </div>

            <ProgressBar
              progress={macro.completionPercent}
              color={macro.name.toLowerCase() as "protein" | "carbs" | "fats"}
              height="sm"
              className="mt-2"
            />

            <div className="mt-1.5 flex items-center justify-between text-xs text-muted">
              <Value value={macro.calories} unit="kcal" />
              <Value value={macro.completionPercent} unit="%" />
            </div>
          </div>
        ))}
      </div>

      <MacroSnapshotModal
        isOpen={isSnapshotOpen}
        onClose={() => setIsSnapshotOpen(false)}
        data={snapshotData}
      />
    </Panel>
  );
}

const DailySummary = memo(DailySummaryInner);

export default DailySummary;
