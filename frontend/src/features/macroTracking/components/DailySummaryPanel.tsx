import { memo, type ReactNode, useMemo, useState } from "react";
import { parseISO } from "date-fns";

import Heading from "@/components/ui/Heading";
import IconButton from "@/components/ui/IconButton";
import Panel from "@/components/ui/Panel";
import Value from "@/components/ui/Value";
import MacroSnapshotModal from "@/features/macroTracking/components/MacroSnapshotModal";
import type { MacroSnapshotData } from "@/features/macroTracking/utils/macroSnapshotCanvas";
import { formatGrouped } from "@/lib/formatNumber";
import { MacroDailyTotals, MacroTargetSettings } from "@/types/macro";
import { getDisplayDate } from "@/utils/dateUtilities";

import {
  calculateCaloriesFromMacros,
  calculateCarbsCalories,
  calculateFatsCalories,
  calculateProteinCalories,
} from "../calculations";
import { TARGET_TOLERANCE, targetStatus } from "../utils/targetStatus";

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

/** Fills from zero once, on load: the page's single orchestrated moment. */
const FILL_IN = "origin-left animate-[fill-in_700ms_ease-out]";

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

interface MacroRowProps {
  name: string;
  grams: number;
  targetGrams: number;
  colorClass: string;
}

/**
 * A macro against its target. The outlined band is "on target" (within 10%),
 * the fill is today; where the fill ends relative to the band is the answer.
 */
function MacroRow({ name, grams, targetGrams, colorClass }: MacroRowProps) {
  const status = targetStatus(grams, targetGrams);
  const scale = Math.max(targetGrams * 1.25, grams) || 1;
  const position = (value: number) => Math.min(100, (value / scale) * 100);
  const bandStart = position(targetGrams * (1 - TARGET_TOLERANCE));
  const bandEnd = position(targetGrams * (1 + TARGET_TOLERANCE));

  return (
    <li>
      <div className="flex items-baseline justify-between gap-3">
        <span className="flex items-baseline gap-2">
          <span className={`h-2 w-2 shrink-0 self-center rounded-full ${colorClass}`} />
          <span className="text-sm">{name}</span>
          <Value value={grams} unit="g" suffix={`of ${targetGrams}`} className="ml-1" />
        </span>
        {status === "hit" ? (
          <span className="text-xs font-medium text-primary">On target</span>
        ) : status === "over" ? (
          <Value
            value={grams - targetGrams}
            unit="g"
            suffix="over"
            className="text-warning"
          />
        ) : (
          <Value
            value={Math.max(0, targetGrams - grams)}
            unit="g"
            suffix="left"
            className="text-muted"
          />
        )}
      </div>
      <div className="relative mt-2 h-2" aria-hidden>
        <div className="absolute inset-0 overflow-hidden rounded-full bg-foreground/8">
          <div
            className={`h-full rounded-full ${colorClass} ${FILL_IN}`}
            style={{ width: `${position(grams)}%` }}
          />
        </div>
        {targetGrams > 0 && (
          <div
            className="absolute -top-1 -bottom-1 rounded-full border border-dashed border-muted"
            style={{ left: `${bandStart}%`, width: `${bandEnd - bandStart}%` }}
          />
        )}
      </div>
    </li>
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
      title: date ? "Daily Macros" : "Today's Macros",
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
      className="flex flex-col max-md:rounded-none max-md:border-0 max-md:bg-transparent"
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
                <p className="mt-1 text-sm text-muted">
                  {isOver ? "over" : "left of"}{" "}
                  {formatGrouped(dailyCalorieTarget)}
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
            ariaLabel="Share Snapshot"
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
          <MacroRow
            key={macro.name}
            name={macro.name}
            grams={macro.grams}
            targetGrams={macro.targetGrams}
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
