import { memo, useMemo } from "react";
import { format, parseISO } from "date-fns";

import { recentEntriesStart } from "@/hooks/queries/macro/entryStore";
import {
  useMacroHistoryForDateRange,
  useRecentMacroEntries,
} from "@/hooks/queries/useMacroQueries";
import { cn } from "@/lib/classnameUtilities";
import type { MacroEntry } from "@/types/macro";
import { addDaysISO, getDisplayDate } from "@/utils/dateUtilities";

import { calculateCaloriesFromMacros } from "../calculations";
import { type TargetStatus, targetStatus } from "../utils/targetStatus";

const DAYS = 7;

const DOT_CLASS: Record<TargetStatus, string> = {
  hit: "h-1.5 w-1.5 bg-primary",
  over: "h-1.5 w-1.5 bg-warning",
  under: "h-1.5 w-1.5 border border-muted",
  empty: "h-1 w-1 bg-border-2",
};

const STATUS_LABEL: Record<TargetStatus, string> = {
  hit: "on target",
  over: "over target",
  under: "under target",
  empty: "nothing logged",
};

interface WeekStripProps {
  date: string;
  today: string;
  calorieTarget: number;
  /** Oldest day a free account can open; unset for Pro. */
  oldestDate?: string;
  onChange: (date: string) => void;
}

/** The last week ends today; an older day is shown with three days after it. */
function windowEnd(date: string, today: string): string {
  if (date > addDaysISO(today, -DAYS)) return today;
  const end = addDaysISO(date, 3);

  return end > today ? today : end;
}

function caloriesByDay(entries: MacroEntry[]): Map<string, number> {
  const totals = new Map<string, { protein: number; carbs: number; fats: number }>();
  for (const entry of entries) {
    const day = totals.get(entry.entryDate) ?? { protein: 0, carbs: 0, fats: 0 };
    day.protein += entry.protein;
    day.carbs += entry.carbs;
    day.fats += entry.fats;
    totals.set(entry.entryDate, day);
  }

  return new Map(
    [...totals].map(([day, t]) => [
      day,
      calculateCaloriesFromMacros(t.protein, t.carbs, t.fats),
    ]),
  );
}

/**
 * Seven days, each with a dot that answers "how did that day go" before a word
 * is read: filled green on target, orange over, a ring still under, a speck
 * for nothing logged. Tapping a day opens it.
 */
function WeekStrip({
  date,
  today,
  calorieTarget,
  oldestDate,
  onChange,
}: WeekStripProps) {
  const end = windowEnd(date, today);
  const start = addDaysISO(end, -(DAYS - 1));
  const isRecent = start >= recentEntriesStart();

  // The device holds the last week, so the usual case costs no request.
  const { entries: recentEntries } = useRecentMacroEntries();
  const { data: rangeEntries } = useMacroHistoryForDateRange(
    isRecent ? undefined : start,
    isRecent ? undefined : end,
  );

  const calories = useMemo(
    () => caloriesByDay(isRecent ? recentEntries : (rangeEntries ?? [])),
    [isRecent, recentEntries, rangeEntries],
  );

  const days = Array.from({ length: DAYS }, (_, index) => {
    const day = addDaysISO(start, index);
    const status = targetStatus(calories.get(day) ?? 0, calorieTarget);

    return { day, status };
  });

  return (
    <div className="grid grid-cols-7 gap-1" role="group" aria-label="Last 7 days">
      {days.map(({ day, status }) => {
        const parsed = parseISO(day);
        const isSelected = day === date;
        const isLocked = oldestDate !== undefined && day < oldestDate;

        return (
          <button
            key={day}
            type="button"
            disabled={isLocked}
            aria-pressed={isSelected}
            aria-label={`${getDisplayDate(parsed)}, ${STATUS_LABEL[status]}`}
            onClick={() => onChange(day)}
            className={cn(
              "flex min-h-14 flex-col items-center justify-center gap-1 rounded-control transition-colors duration-200",
              isSelected ? "bg-surface-3" : "hover:bg-surface-2",
              isLocked && "opacity-40",
            )}
          >
            <span className="text-[11px] text-muted">{format(parsed, "EEEEE")}</span>
            <span
              className={cn(
                "text-sm tabular-nums",
                day === today ? "font-semibold text-foreground" : "text-foreground/80",
              )}
            >
              {format(parsed, "d")}
            </span>
            <span aria-hidden className={cn("rounded-full", DOT_CLASS[status])} />
          </button>
        );
      })}
    </div>
  );
}

export default memo(WeekStrip);
