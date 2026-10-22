import { memo } from "react";

import Value from "@/components/ui/Value";
import { recentEntriesStart } from "@/hooks/queries/macro/entryStore";
import {
  useMacroHistoryForDateRange,
  useRecentMacroEntries,
} from "@/hooks/queries/useMacroQueries";
import { cn } from "@/lib/classnameUtilities";
import type { MealType } from "@/types/macro";

import { calculateCaloriesFromMacros } from "../calculations";

import { HISTORY_ROW_GRID } from "./EntryHistoryShared";
import { MacroSplitBar } from "./MacroSplitBar";

const MEALS: { key: MealType; label: string }[] = [
  { key: "breakfast", label: "Breakfast" },
  { key: "lunch", label: "Lunch" },
  { key: "dinner", label: "Dinner" },
  { key: "snack", label: "Snacks" },
];

/**
 * The day by meal, in the same columns as the history rows: where the calories
 * went, and which meals are still open.
 */
function MealBreakdown({ date }: { date: string }) {
  const isRecent = date >= recentEntriesStart();

  // The device holds the last week, so the usual case costs no request.
  const { entries: recentEntries } = useRecentMacroEntries();
  const { data: rangeEntries } = useMacroHistoryForDateRange(
    isRecent ? undefined : date,
    isRecent ? undefined : date,
  );
  const entries = (isRecent ? recentEntries : (rangeEntries ?? [])).filter(
    (entry) => entry.entryDate === date,
  );

  return (
    <ul className="flex flex-1 flex-col divide-y divide-border">
      {MEALS.map((meal) => {
        const totals = entries
          .filter((entry) => entry.mealType === meal.key)
          .reduce(
            (sum, entry) => ({
              protein: sum.protein + entry.protein,
              carbs: sum.carbs + entry.carbs,
              fats: sum.fats + entry.fats,
            }),
            { protein: 0, carbs: 0, fats: 0 },
          );
        const calories = calculateCaloriesFromMacros(
          totals.protein,
          totals.carbs,
          totals.fats,
        );

        return (
          <li key={meal.key} className={cn(HISTORY_ROW_GRID, "flex-1 py-0.5 lg:py-1")}>
            <span className="text-sm">{meal.label}</span>
            {calories > 0 ? (
              <>
                <MacroSplitBar {...totals} />
                <Value value={calories} unit="kcal" className="justify-self-end" />
              </>
            ) : (
              <span className="col-span-2 justify-self-end text-xs text-muted">
                Not logged
              </span>
            )}
          </li>
        );
      })}
    </ul>
  );
}

export default memo(MealBreakdown);
