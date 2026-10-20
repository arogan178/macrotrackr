import { memo, type ReactNode, useMemo, useState } from "react";
import { parseISO } from "date-fns";

import Heading from "@/components/ui/Heading";
import IconButton from "@/components/ui/IconButton";
import Panel from "@/components/ui/Panel";
import Value from "@/components/ui/Value";
import MacroSnapshotModal from "@/features/macroTracking/components/MacroSnapshotModal";
import TargetRow, { CHIP, FILL_IN } from "@/features/macroTracking/components/TargetRow";
import type { MacroSnapshotData } from "@/features/macroTracking/utils/macroSnapshotCanvas";
import { cn } from "@/lib/classnameUtilities";
import { formatGrouped } from "@/lib/formatNumber";
import { MacroDailyTotals, MacroTargetSettings } from "@/types/macro";
import { getDisplayDate } from "@/utils/dateUtilities";

import {
  calculateCaloriesFromMacros,
  calculateCarbsCalories,
  calculateFatsCalories,
  calculateProteinCalories,
} from "../calculations";
import { targetStatus } from "../utils/targetStatus";

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


interface CalorieGaugeProps {
  protein: number;
  carbs: number;
  fats: number;
  target: number;
}

/**
 * The day as one bar: what has been eaten, split by where it came from, against
 * a notch at the target. Past the notch the bar turns orange, so "over" reads
 * without a word.
 */
function CalorieGauge({ protein, carbs, fats, target }: CalorieGaugeProps) {
  const total = protein + carbs + fats;
  const scale = Math.max(target, total) || 1;
  const share = (value: number) => `${(value / scale) * 100}%`;
  const notch = target > 0 ? (target / scale) * 100 : undefined;
  const isOver = notch !== undefined && total > target;

  return (
    <div className="relative mt-5 h-3" aria-hidden>
      <div className="absolute inset-0 overflow-hidden rounded-full bg-foreground/8">
        <div className={`flex h-full ${FILL_IN}`}>
          <div className="h-full bg-protein" style={{ width: share(protein) }} />
          <div className="h-full bg-carbs" style={{ width: share(carbs) }} />
          <div className="h-full bg-fats" style={{ width: share(fats) }} />
        </div>
        {isOver && (
          <div
            className="absolute inset-y-0 right-0 bg-warning"
            style={{ left: `${notch}%` }}
          />
        )}
      </div>
      {notch !== undefined && (
        <div
          className="absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-full bg-foreground"
          style={{ left: `${Math.min(notch, 99.5)}%` }}
        />
      )}
    </div>
  );
}

interface DailySummaryProps {
  macroDailyTotals?: MacroDailyTotals;
  macroTarget?: MacroTargetSettings;
  calorieTarget?: number;
  /** The day shown, when it is not today. */
  date?: string;
  /** A control for the day, shown beside the target figure. */
  dayAction?: ReactNode;
}

function DailySummaryInner({
  macroDailyTotals,
  macroTarget,
  calorieTarget,
  date,
  dayAction,
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
      title: date ? "Daily macros" : "Today's Macros",
      dateLabel: getDisplayDate(date ? parseISO(date) : new Date()),
      calories: macroCalories.total,
      calorieTarget: dailyCalorieTarget,
      protein: safeTotal.protein,
      proteinTarget: targetGrams.protein,
      carbs: safeTotal.carbs,
      carbsTarget: targetGrams.carbs,
      fats: safeTotal.fats,
      fatsTarget: targetGrams.fats,
      badgeLabel: `${completionPercentages.calories}% of Goal`,
    }),
    [
      date,
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

  const remaining = dailyCalorieTarget - macroCalories.total;
  const isOver = dailyCalorieTarget > 0 && remaining < 0;
  const dayLabel = date ? getDisplayDate(parseISO(date)) : "Today";

  return (
    // On a phone the page is the panel: no box, the day sits on the background.
    <Panel
      padding="none"
      flatOnPhone
      className="flex flex-col"
    >
      <div className="md:p-6">
        <div className="mb-3 hidden items-center justify-between md:flex">
          <Heading level="panel">{dayLabel}</Heading>
        </div>

        <div className="flex items-start justify-between gap-3">
          <div>
            {/* The one animated number on the page: what is left to eat. */}
            {dailyCalorieTarget > 0 ? (
              <>
                <Value
                  size="hero"
                  unit="kcal"
                  animate
                  value={Math.abs(remaining)}
                  className={isOver ? "text-warning" : undefined}
                />
                <p className="mt-1 flex items-center gap-2 text-sm text-muted">
                  {isOver ? "over" : "left of"} {formatGrouped(dailyCalorieTarget)}
                  {targetStatus(macroCalories.total, dailyCalorieTarget) === "hit" && (
                    <span className={cn(CHIP, "bg-primary/12 text-primary")}>On target</span>
                  )}
                </p>
              </>
            ) : (
              <>
                <Value size="hero" unit="kcal" animate value={macroCalories.total} />
                <p className="mt-1 text-sm text-muted">eaten, no target set</p>
              </>
            )}
          </div>
          <IconButton
            variant="share"
            buttonSize="sm"
            iconSize="sm"
            ariaLabel="Share snapshot"
            onClick={() => setIsSnapshotOpen(true)}
          />
        </div>

        <CalorieGauge
          protein={macroCalories.protein}
          carbs={macroCalories.carbs}
          fats={macroCalories.fats}
          target={dailyCalorieTarget}
        />

        <div className="mt-2 flex min-h-11 items-center justify-between gap-3">
          <Value value={macroCalories.total} unit="kcal" suffix="eaten" className="text-sm" />
          {dayAction}
        </div>
      </div>

      <ul className="mt-6 space-y-5 md:mt-0 md:border-t md:border-border md:p-6">
        {macroData.map((macro) => (
          <TargetRow
            key={macro.name}
            name={macro.name}
            value={macro.grams}
            target={macro.targetGrams}
            unit="g"
            colorClass={macro.color}
          />
        ))}
      </ul>

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
